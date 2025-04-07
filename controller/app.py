from flask import Flask, render_template, jsonify, request, url_for, redirect
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'

# Simulated GPIO for non‑RPi environments
try:
    import RPi.GPIO as GPIO
except ImportError:
    class FakeGPIO:
        BCM = 'BCM'
        OUT = 'OUT'
        HIGH = True
        LOW = False
        def __init__(self):
            self.state = {}
        def setmode(self, mode): pass
        def setwarnings(self, flag): pass
        def setup(self, pin, mode): self.state[pin] = self.LOW
        def output(self, pin, value):
            self.state[pin] = value
            print(f"[GPIO SIM] Pin {pin} → {'HIGH' if value else 'LOW'}")
    GPIO = FakeGPIO()

# Initialize GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
RELAY1_PIN, RELAY2_PIN = 17, 27
GPIO.setup(RELAY1_PIN, GPIO.OUT)
GPIO.setup(RELAY2_PIN, GPIO.OUT)
GPIO.output(RELAY1_PIN, GPIO.LOW)
GPIO.output(RELAY2_PIN, GPIO.LOW)

# Map service names to relay pins
SERVICE_TO_PIN = {
    "water": RELAY1_PIN,
    "osmosis": RELAY1_PIN,
    "chemicals": RELAY2_PIN,
    "foam": RELAY2_PIN
}

# In‑memory service state
service_state = {
    "running": False,
    "service": None,
    "balance": 1000,
    "time_remaining": 0
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/start', methods=['POST'])
def api_start():
    data = request.get_json()
    service = data.get("service")
    rate = data.get("rate", 0)
    balance = service_state["balance"]

    # compute how many seconds they get
    seconds = int(balance * 60 / rate) if rate else 0
    service_state.update({
        "running": True,
        "service": service,
        "rate": rate,
        "time_remaining": seconds
    })

    # Turn on the corresponding relay
    pin = SERVICE_TO_PIN.get(service)
    if pin:
        GPIO.output(pin, GPIO.HIGH)

    return jsonify(service_state)

@app.route('/api/pause', methods=['POST'])
def api_pause():
    # Stop service but keep state
    service_state["running"] = False
    pin = SERVICE_TO_PIN.get(service_state["service"])
    if pin:
        GPIO.output(pin, GPIO.LOW)
    return jsonify(service_state)

@app.route('/api/status')
def api_status():
    return jsonify(service_state)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
