// adapted from https://gitlab.com/librespacefoundation/satnogs/satnogs-rotator-firmware/blob/master/libraries/easycomm.h

#ifndef LIBRARIES_EASYCOMM_H_
#define LIBRARIES_EASYCOMM_H_

#include <Arduino.h>
#include <WString.h>
#include <avr/wdt.h>

#include "serialCommands.h"

#define BUFFER_SIZE   256   ///< Set the size of serial buffer
// #define BAUDRATE      19200 ///< Set the Baudrate of easycomm 3 protocol
#define BAUDRATE      9600  ///< Set the Baudrate of easycomm 3 protocol

// float and double are the same in the Uno
#define strtof(A, B) strtod(A, B)

enum easycommNotification {
  MOTORS_DISABLED,
  ADVANCE_FRAME_STARTED,
  REVERSE_FRAME_STARTED,
  ADVANCE_STARTED,
  REVERSE_STARTED,
  MOTION_STOPPED,
};

/**************************************************************************/
/*!
    @brief    Class that functions for easycomm 3 implementation
*/
/**************************************************************************/
class easycomm {
public:

    void easycomm_init() {
        Serial.begin(BAUDRATE);
        _commandTooLongForBuffer = false;
        Serial.println("CONNECTED");
        Serial.println("# compiled " __DATE__ " " __TIME__);
    }

    serialCommand easycomm_proc() {
        char buffer[BUFFER_SIZE];
        char incomingByte;
        static uint16_t bufferActiveSize = 0;
        serialCommand command = { code: NONE };

        // Read from serial
        while (Serial.available() > 0) {
            incomingByte = Serial.read();

            // '\n' terminates a command line
            if (incomingByte == '\n') {

              if (_commandTooLongForBuffer == true) {
                // reset
                bufferActiveSize = 0;
                _commandTooLongForBuffer = false;
              } else {
                  buffer[bufferActiveSize] = 0;
                  if (
                    buffer[0] == 'S' &&
                    buffer[1] == 0
                  ) {
                    bufferActiveSize = 0;
                    return { code: STOP };
                  } else if (
                    buffer[0] == 'I' &&
                    buffer[1] == 0
                  ) {
                    bufferActiveSize = 0;
                    return { code: PRINT_INFO };
                  } else if (
                    buffer[0] == 'A' &&
                    buffer[1] == 'F' &&
                    buffer[2] == 0
                  ) {
                    bufferActiveSize = 0;
                    return { code: ADVANCE_FRAME };
                  } else if (
                    buffer[0] == 'R' &&
                    buffer[1] == 'F' &&
                    buffer[2] == 0
                  ) {
                    bufferActiveSize = 0;
                    return { code: REVERSE_FRAME };
                  } else if (
                    buffer[0] == 'A' &&
                    buffer[1] == 0
                  ) {
                    bufferActiveSize = 0;
                    return { code: ADVANCE };
                  } else if (
                    buffer[0] == 'R' &&
                    buffer[1] == 0
                  ) {
                    bufferActiveSize = 0;
                    return { code: REVERSE };
                  } else if (
                      buffer[0] == 'A' &&
                      buffer[1] == ' ' &&
                      buffer[2] == 'S' &&
                      buffer[3] == ' '
                  ) {
                    // set ADVANCE speed
                    char remainingBuffer = buffer + 4;
                    if (isNumber(remainingBuffer)) {
                      float advanceSpeed = strtof(remainingBuffer, NULL);
                      bufferActiveSize = 0;
                      return {
                        code: SET_ADVANCE_SPEED,
                        speed: advanceSpeed,
                      };
                    } else {
                      Serial.println("# ERR: invalid number");
                      bufferActiveSize = 0;
                    }
                  } else {
                    Serial.println("# ERR: unknown command");
                    Serial.print("# ");
                    Serial.println(buffer);
                    bufferActiveSize = 0;
                  }
              }
            } else {
              // Fill the buffer with incoming data
              if (_commandTooLongForBuffer == false) {
                buffer[bufferActiveSize] = incomingByte;
                bufferActiveSize++;
              }
              if (bufferActiveSize > BUFFER_SIZE) {
                // error!
                // avoid an overflow
                bufferActiveSize = 0;
                _commandTooLongForBuffer = true;
              }
            }
        }
        return command;
    }

    void notify(easycommNotification code) {
      String msg;
      switch (code) {
        case MOTORS_DISABLED:
          msg = "MOTORS_DISABLED";
          break;
        case ADVANCE_FRAME_STARTED:
          msg = "ADVANCE_FRAME_STARTED";
          break;
        case REVERSE_FRAME_STARTED:
          msg = "REVERSE_FRAME_STARTED";
          break;
        case MOTION_STOPPED:
          msg = "MOTION_STOPPED";
          break;
        default:
          return;
      }
      Serial.println(msg);
    }

    void printInfo(
      float currentSpeed,
      float movingSpeed,
      float maxSpeed,
      bool switchPressed
    ) {
      Serial.print("# current speed: ");
      Serial.println(currentSpeed);
      Serial.print("# moving speed: ");
      Serial.println(movingSpeed);
      Serial.print("# maximum speed: ");
      Serial.println(maxSpeed);
      Serial.print("# switch pressed: ");
      Serial.println(switchPressed ? "yes" : "no");
    }

private:
    bool _commandTooLongForBuffer;

    private:
    bool isNumber(char *input) {
        for (uint16_t i = 0; input[i] != '\0'; i++) {
            if (!(isdigit(input[i]) || input[i] == '.'))
                return false;
        }
        return true;
    }

};

#endif /* LIBRARIES_EASYCOMM_H_ */
