
// kayıtlara geçsin
// basit bir projeyi kendi kendime komplike hale getirmeye çalıştığım için proje ortasında pişman oldum

class Timer {
    constructor() {
        this.timeLeft = 60;
        this.totalTime = 60;
        this.isRunning = false;
        this.interval = null;
        this.soundEnabled = true;
        this.isEditing = false;
        this.editingUnit = null;
        this.alarmInterval = null;
        this.stopBtnBlinkInterval = null;
        
        this.tickSound = new Audio('assets/tick.mp3');
        this.alarmSound = new Audio('assets/alarm.mp3');
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.soundToggle = document.getElementById('soundToggle');
        this.minutesDisplay = document.getElementById('minutes');
        this.secondsDisplay = document.getElementById('seconds');
        this.statusMessage = document.getElementById('statusMessage');
        this.progressCircle = document.querySelector('.progress-ring-circle');
        this.timerDisplay = document.getElementById('timerDisplay');
        
        // svg için 1 saat kafa patlatacağımı hiç düşünmemiştim
        const circle = this.progressCircle;
        const radius = circle.r.baseVal.value;
        this.circumference = radius * 2 * Math.PI;
        circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        circle.style.strokeDashoffset = this.circumference;
        
        this.pauseBtn.style.display = 'none';
    }
    
    bindEvents() {
        this.playBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.soundToggle.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
        
        this.minutesDisplay.addEventListener('click', () => this.startEditing('minutes'));
        this.secondsDisplay.addEventListener('click', () => this.startEditing('seconds'));
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        document.addEventListener('click', (e) => {
            if (!this.timerDisplay.contains(e.target)) {
                this.finishEditing();
            }
        });
    }
    
    startEditing(unit) {
        if (this.isRunning) {
            this.showStatus('Cannot change time while countdown is running!', 'error');
            return;
        }
        
        this.isEditing = true;
        this.editingUnit = unit;
        this.timerDisplay.classList.add('editing');
        
        const element = unit === 'minutes' ? this.minutesDisplay : this.secondsDisplay;
        const currentValue = element.textContent;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.max = '59';
        input.value = currentValue;
        input.className = 'time-input';
        input.style.cssText = `
            width: 120px;
            height: 120px;
            font-size: 7rem;
            font-weight: bold;
            text-align: center;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-family: 'Courier New', monospace;
        `;
        
        element.style.display = 'none';
        element.parentNode.insertBefore(input, element);
        
        input.focus();
        input.select();
        
        input.addEventListener('blur', () => this.finishEditing());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.finishEditing();
            } else if (e.key === 'Escape') {
                this.cancelEditing();
            }
        });
        
        this.currentInput = input;
        this.showStatus(`${unit === 'minutes' ? 'Minutes' : 'Seconds'} editing mode. Type the value and press Enter.`, 'warning');
    }
    
    finishEditing() {
        if (!this.isEditing || !this.currentInput) return;
        
        const newValue = parseInt(this.currentInput.value);
        const element = this.editingUnit === 'minutes' ? this.minutesDisplay : this.secondsDisplay;
        
        if (isNaN(newValue) || newValue < 0 || newValue > 59) {
            this.cancelEditing();
            this.showStatus('Please enter a valid value between 0-59!', 'error');
            return;
        }
        
        element.textContent = newValue.toString().padStart(2, '0');
        
        this.currentInput.remove();
        element.style.display = '';
        
        const minutes = parseInt(this.minutesDisplay.textContent);
        const seconds = parseInt(this.secondsDisplay.textContent);
        this.totalTime = minutes * 60 + seconds;
        this.timeLeft = this.totalTime;
        
        this.isEditing = false;
        this.editingUnit = null;
        this.currentInput = null;
        this.timerDisplay.classList.remove('editing');
        
        this.updateDisplay();
        this.updateProgressRing();
        this.showStatus('Time updated!', 'success');
    }
    
    cancelEditing() {
        if (!this.isEditing || !this.currentInput) return;
        
        const element = this.editingUnit === 'minutes' ? this.minutesDisplay : this.secondsDisplay;
        
        this.currentInput.remove();
        element.style.display = '';
        
        this.isEditing = false;
        this.editingUnit = null;
        this.currentInput = null;
        this.timerDisplay.classList.remove('editing');
    }
    
    handleKeyPress(e) {
        if (!this.isEditing) return;
        
        if (e.key === 'Escape') {
            e.preventDefault();
            this.cancelEditing();
        }
    }
    
    start() {
        if (this.timeLeft <= 0) {
            this.showStatus('Time is up! Please set a new time.', 'warning');
            return;
        }
        
        if (!this.isRunning) {
            this.isRunning = true;
            this.playBtn.style.display = 'none';
            this.pauseBtn.style.display = 'flex';
            
            this.interval = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                this.updateProgressRing();
                
                if (this.soundEnabled && this.timeLeft > 0) {
                    this.playTickSound();
                }
                
                if (this.timeLeft <= 0) {
                    this.stop();
                    this.startAlarm();
                    this.startStopBtnBlink();
                    this.showStatus('Time is up! Press stop to turn off the alarm.', 'warning');
                }
            }, 1000);
            
            this.showStatus('Countdown started!', 'success');
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.playBtn.style.display = 'flex';
            this.pauseBtn.style.display = 'none';
            clearInterval(this.interval);
            this.showStatus('Countdown paused.', 'warning');
        }
    }
    
    stop() {
        this.isRunning = false;
        this.playBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        clearInterval(this.interval);
        
        this.stopAlarm();
        this.stopStopBtnBlink();
        
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateProgressRing();
        this.showStatus('Timer stopped and reset!', 'success');
    }
    
    startAlarm() {
        if (!this.soundEnabled) return;
        
        this.playAlarmSound();
        
        this.alarmInterval = setInterval(() => {
            if (this.soundEnabled) {
                this.playAlarmSound();
            }
        }, 1500);
    }
    
    stopAlarm() {
        if (this.alarmInterval) {
            clearInterval(this.alarmInterval);
            this.alarmInterval = null;
        }
    }
    
    startStopBtnBlink() {
        let isVisible = true;
        this.stopBtnBlinkInterval = setInterval(() => {
            this.stopBtn.style.opacity = isVisible ? '0.3' : '1';
            isVisible = !isVisible;
        }, 500);
    }
    
    stopStopBtnBlink() {
        if (this.stopBtnBlinkInterval) {
            clearInterval(this.stopBtnBlinkInterval);
            this.stopBtnBlinkInterval = null;
            this.stopBtn.style.opacity = '1';
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        this.minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        this.secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }
    
    updateProgressRing() {
        const circle = this.progressCircle;
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        
        const progress = this.timeLeft / this.totalTime;
        const offset = circumference - (progress * circumference);
        this.progressCircle.style.strokeDashoffset = offset;
    }
    
    playTickSound() {
        this.tickSound.currentTime = 0;
        this.tickSound.play().catch(e => console.log('Could not play sound:', e));
    }
    
    playAlarmSound() {
        if (this.soundEnabled) {
            this.alarmSound.currentTime = 0;
            this.alarmSound.play().catch(e => console.log('Could not play alarm sound:', e));
        }
    }
    
    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type} show`;
        
        setTimeout(() => {
            this.statusMessage.classList.remove('show');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Timer();
}); 