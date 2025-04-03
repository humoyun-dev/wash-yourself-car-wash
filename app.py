from flask import Flask, render_template, jsonify
from threading import Lock
import time
import threading

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'

# Hardware configuration
RELAY_PIN = 17

# Simulated GPIO for non-RPi environments
try:
    import RPi.GPIO as GPIO
except ImportError:
    class FakeGPIO:
        BCM = 'BCM'
        OUT = 'OUT'
        HIGH = True
        LOW = False
        _state = {}

        def setmode(self, mode): pass
        def setwarnings(self, flag): pass
        
        def setup(self, pin, mode):
            self._state[pin] = self.LOW
            
        def output(self, pin, value):
            self._state[pin] = value
            print(f"[GPIO SIM] Pin {pin} set to {'HIGH' if value else 'LOW'}")
            
    GPIO = FakeGPIO()

# Initialize GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(RELAY_PIN, GPIO.OUT)
GPIO.output(RELAY_PIN, GPIO.LOW)

class WashingMachine:
    def __init__(self):
        self.lock = Lock()
        self.balance = 10000  # Initial balance in UZS
        self.current_service = None
        self.status = "idle"  # idle, running, paused
        self.start_time = None
        self.duration = 0
        self.rate = 0
        self.timer = None
        
    def start_service(self, service_name, rate):
        with self.lock:
            if self.status != "idle":
                return False
            
            self.current_service = service_name
            self.rate = rate
            self.duration = (self.balance / rate) * 60  # in seconds
            self.status = "running"
            self.start_time = time.time()
            
            # Start hardware
            GPIO.output(RELAY_PIN, GPIO.HIGH)
            
            # Start background timer
            self.timer = threading.Thread(target=self._run_timer)
            self.timer.start()
            return True
            
    def _run_timer(self):
        while self.status == "running" and self.get_remaining_time() > 0:
            time.sleep(1)
            with self.lock:
                self.balance -= self.rate / 60
                self.balance = max(self.balance, 0)
                
        self.stop_service()
            
    def pause_service(self):
        with self.lock:
            if self.status == "running":
                self.status = "paused"
                GPIO.output(RELAY_PIN, GPIO.LOW)
                return True
        return False
            
    def resume_service(self):
        with self.lock:
            if self.status == "paused":
                self.status = "running"
                self.start_time = time.time() - self.get_elapsed_time()
                GPIO.output(RELAY_PIN, GPIO.HIGH)
                return True
        return False
            
    def stop_service(self):
        with self.lock:
            self.status = "idle"
            self.current_service = None
            self.duration = 0
            self.rate = 0
            GPIO.output(RELAY_PIN, GPIO.LOW)
            
    def get_remaining_time(self):
        if self.status == "idle":
            return 0
        elapsed = time.time() - self.start_time
        remaining = self.duration - elapsed
        return max(remaining, 0)
    
    def get_elapsed_time(self):
        if self.status == "idle":
            return 0
        return time.time() - self.start_time
    
    def get_state(self):
        return {
            "balance": round(self.balance),
            "status": self.status,
            "current_service": self.current_service,
            "remaining_time": round(self.get_remaining_time()),
            "rate": self.rate
        }

washing_machine = WashingMachine()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/control', methods=['POST'])
def control():
    action = request.json.get('action')
    service = request.json.get('service')
    rate = request.json.get('rate')
    
    if action == "start":
        if washing_machine.start_service(service, rate):
            return jsonify(washing_machine.get_state())
        return jsonify({"error": "Cannot start service"}), 400
    
    elif action == "pause":
        if washing_machine.pause_service():
            return jsonify(washing_machine.get_state())
        return jsonify({"error": "Cannot pause service"}), 400
        
    elif action == "resume":
        if washing_machine.resume_service():
            return jsonify(washing_machine.get_state())
        return jsonify({"error": "Cannot resume service"}), 400
        
    elif action == "stop":
        washing_machine.stop_service()
        return jsonify(washing_machine.get_state())
    
    return jsonify({"error": "Invalid action"}), 400

@app.route('/api/state')
def get_state():
    return jsonify(washing_machine.get_state())

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)