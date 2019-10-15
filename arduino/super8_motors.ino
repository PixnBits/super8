// adapted from https://gitlab.com/librespacefoundation/satnogs/satnogs-rotator-firmware

#define MOTOR_DISABLE_DELAY 3 * 1e3 // millis

#define STEPS_PER_REV      200 // property of the stepper motor (ex: 1.8 deg / 360 deg = 200 steps)
#define MICROSTEP          16 // property of the driver 1, 2, 4, 8, 16, 32
#define MICROSTEPS_PER_REV STEPS_PER_REV * MICROSTEP
#define MIN_PULSE_WIDTH    20    // ms
#define MAX_SPEED          6 * MICROSTEPS_PER_REV
#define MAX_ACCELERATION   200 * MICROSTEP  // (micro)steps/s^2
#define MOTOR_FOWARD_DIR -1 // 1 for CCW, -1 for CW

#define SWITCH_DEFAULT_STATE LOW

// < indicates library, " for other files
#include <AccelStepper.h>
#include <Wire.h>

#include "serialCommands.h"
#include "easycomm.h"
#include "pins.h"
#include "endstop.h"

easycomm comm;
AccelStepper stepper_film(AccelStepper::DRIVER, PIN_FILM_STEP, PIN_FILM_DIR);
endstop switch_frame(PIN_FILM_SWITCH, SWITCH_DEFAULT_STATE);
bool actionFrameLimitHit = false;
bool frameLimitNeedsToUnhit;
unsigned long millisMotorsStoppedAt;
float targetSpeed = MICROSTEPS_PER_REV;

void printInfo() {
  comm.printInfo(
    stepper_film.speed(),
    targetSpeed,
    MAX_SPEED,
    switch_frame.get_state()
  );
}

void setup() {
    // Homing switch
    switch_frame.init();

    // Serial Communication
    comm.easycomm_init();

    // Stepper Motor setup
    pinMode(PIN_MOTOR_EN, OUTPUT);
    stepper_film.setEnablePin(PIN_MOTOR_EN);
    // direction, step, enable
    stepper_film.setPinsInverted(false, false, true);
    stepper_film.disableOutputs();

    stepper_film.setMaxSpeed(MAX_SPEED);
    stepper_film.setAcceleration(MAX_ACCELERATION);
    stepper_film.setMinPulseWidth(MIN_PULSE_WIDTH);

    // initial speed
    stepper_film.setSpeed(0);

    millisMotorsStoppedAt = 0;
    printInfo();
}

void loop() {
    bool frameLimitHit = switch_frame.get_state();

    if (
      actionFrameLimitHit == true &&
      frameLimitHit == true &&
      frameLimitNeedsToUnhit == false
    ) {
      stepper_film.setSpeed(0);
      stepper_film.stop();
      comm.notify(MOTION_STOPPED);
      actionFrameLimitHit = false;
      millisMotorsStoppedAt = millis();
    }

    if (
      actionFrameLimitHit == true &&
      frameLimitNeedsToUnhit == true &&
      frameLimitHit == false
    ) {
      frameLimitNeedsToUnhit = false;
    }

    if (
      millisMotorsStoppedAt != 0 &&
      (millis() - millisMotorsStoppedAt) > MOTOR_DISABLE_DELAY
    ) {
      stepper_film.disableOutputs();
      comm.notify(MOTORS_DISABLED);
      millisMotorsStoppedAt = 0;
    }

    // detect and action any command
    serialCommand command = comm.easycomm_proc();
    switch(command.code) {
      case NONE:
        break;
      case STOP:
        stepper_film.setSpeed(0);
        stepper_film.stop();
        stepper_film.disableOutputs();
        comm.notify(MOTORS_DISABLED);
        millisMotorsStoppedAt = 0;
        break;
      case ADVANCE_FRAME:
        stepper_film.enableOutputs();
        stepper_film.setSpeed(MOTOR_FOWARD_DIR * targetSpeed);
        stepper_film.runSpeed();
        actionFrameLimitHit = true;
        frameLimitNeedsToUnhit = frameLimitHit;
        millisMotorsStoppedAt = 0;
        comm.notify(ADVANCE_FRAME_STARTED);
        break;
      case REVERSE_FRAME:
        stepper_film.enableOutputs();
        stepper_film.setSpeed(-1 * MOTOR_FOWARD_DIR * targetSpeed);
        stepper_film.runSpeed();
        actionFrameLimitHit = true;
        frameLimitNeedsToUnhit = frameLimitHit;
        millisMotorsStoppedAt = 0;
        comm.notify(REVERSE_FRAME_STARTED);
        break;
      case ADVANCE:
        stepper_film.enableOutputs();
        stepper_film.setSpeed(MOTOR_FOWARD_DIR * targetSpeed);
        stepper_film.runSpeed();
        actionFrameLimitHit = false;
        millisMotorsStoppedAt = 0;
        comm.notify(ADVANCE_STARTED);
        break;
      case REVERSE:
        stepper_film.enableOutputs();
        stepper_film.setSpeed(-1 * MOTOR_FOWARD_DIR * targetSpeed);
        stepper_film.runSpeed();
        actionFrameLimitHit = false;
        millisMotorsStoppedAt = 0;
        comm.notify(REVERSE_STARTED);
        break;
      case SET_ADVANCE_SPEED:
        targetSpeed = command.speed;
        if (stepper_film.speed() != 0.0) {
          stepper_film.setSpeed(MOTOR_FOWARD_DIR * targetSpeed);
        }
        break;
      case PRINT_INFO:
        printInfo();
        break;
    }

    stepper_film.runSpeed();
}
