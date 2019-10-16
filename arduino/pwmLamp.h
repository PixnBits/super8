#ifndef PWMLAMP_H_
#define PWMLAMP_H_

class pwmLamp {
public:

    pwmLamp(uint8_t pin) {
        _pin = pin;
        _last_on_brightness = 25; // 10%
    }

    // setup for output for PWM
    void init() {
        pinMode(_pin, OUTPUT);
        off();
    }

    bool setBrightness(int brightness) {
      if (brightness < 0 || brightness > 255) {
        return false;
      }
      if (brightness != 0) {
        _last_on_brightness = brightness;
      }
      analogWrite(_pin, brightness);
      return true;
    }

    void on() {
      setBrightness(_last_on_brightness);
    }

    void off() {
      setBrightness(0);
    }

private:
    uint8_t _pin;
    int _last_on_brightness;
};

#endif /* PWMLAMP_H_ */
