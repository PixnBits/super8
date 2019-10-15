# Arduino Stepper Motor Control of a Super 8 Projector

[The Adruino Create project](https://create.arduino.cc/editor/pixnbits/b88c3b52-df35-4c8b-b53f-45e85873715e)

## Arduino CNC Shield

For some reason the wiring wasn't working for the Pi directly connected to the `DRV8825`. I did have a CNC Shield v3 on hand (also why I had four `DRV8825`s in the first place) so this is a sketch to control the stepper motor via USB serial.

## Connections

The `pins.h` file is set up for a motor and limit switch to be connected to the X axis. The limit switch pins on the shield are wired to the same Arduino pin so +X or -X doesn't make a difference.

## Protocol

Text, each command is `\n` terminated

### Stop
* `S\n` Stop: stops the motor and turns off the power to it.
  * `MOTORS_DISABLED\n` will be received when the motors stop.

### Information
* `I\n`: Information, multiple lines logging the parameters and values will be received:
  * `# current speed: 0.00\n` shows the (micro)steps per second velocity the motor is told to be moving at
  * `# moving speed: 3200.00\n` shows the velocity that will be used for an Advance
  * `# maximum speed: 10000.00\n` shows what the moving speed will be capped at
  * `# switch pressed: no\n` shows the measured value of the limit switch (`yes` for on and `no` for off)

### Advance
* `AF\n`: Advance Frame, will spin the stepper motor CCW until the limit switch is triggered.
  * `ADVANCE_FRAME_STARTED\n` will be received when the motor starts turning
  * `MOTION_STOPPED\n` will be received when the limit switch is triggered
  * `MOTORS_DISABLED\n` will be received if no Advance command is transmitted within a certain time after the limit switch is triggered.
* `A\n`: Advance, will spin the stepper motor CCW ignoring the limit switch
  * `ADVANCE_STARTED\n` will be received when the motor starts turning
* `RF\n`: Reverse Frame, same as Advance Frame but CW
* `R\n`: Reverse, same as Advance but CW
* `A S 3200\n`: Sets the (micro)steps per second velocity of the motor for Advancements
  * `# ERR: invalid number\n` is received if the value transmitted is determined to not be a number
  * no messages are received if the value is used, though the Information command can confirm the new value
