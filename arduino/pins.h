/*!
* @file rotator_pins.h
* adapted from https://gitlab.com/librespacefoundation/satnogs/satnogs-rotator-firmware/blob/master/libraries/rotator_pins.h
* It is a header file for pin mapping.
*
* Licensed under the GPLv3
*
*/

#ifndef PINS_H_
#define PINS_H_

// CNC Shield pins

#define PIN_SCL               A5
#define PIN_SDA               A4
#define PIN_COOLANT           A3
#define PIN_RESUME            A2
#define PIN_HOLD              A1
#define PIN_ABORT             A0

#define PIN_RX                 0
#define PIN_TX                 1
#define PIN_X_STEP             2
#define PIN_Y_STEP             3 // PWM
#define PIN_Z_STEP             4
#define PIN_X_DIR              5 // PWM
#define PIN_Y_DIR              6 // PWM
#define PIN_Z_DIR              7

#define PIN_ENABLE             8
#define PIN_X_LIMIT            9 // PWM
#define PIN_Y_LIMIT           10 // PWM
#define PIN_Z_LIMIT           11 // PWM
#define PIN_SPINDLE_ENABLE    12
#define PIN_SPINDLE_DIRECTION 13

// Super8 pins

#define PIN_MOTOR_EN    PIN_ENABLE  // 8
#define PIN_FILM_STEP   PIN_X_STEP  // 2
#define PIN_FILM_DIR    PIN_X_DIR   // 5
#define PIN_FILM_SWITCH PIN_X_LIMIT // 9
#define PIN_LAMP        PIN_Z_LIMIT // 11, must be PWM

#endif /* PINS_H_ */
