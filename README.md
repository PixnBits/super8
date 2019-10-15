# Super8

Digitizing Super 8 film frames.

## Hardware

I purchased a [Bell & Howell Super Eight Design 346A projector off of ebay](https://www.ebay.com/sch/i.html?_nkw=Bell+%26+Howell+Super+Eight+Design+346A). I removed the motor, shutter wheel, lamp mount, switch, and fan housing. I modified an ST2 pulley to fit onto the frame advance shaft and attached an ST2 belt to a stepper motor. Currently the stepper motor is held on by a clamp, but when I figure out a proper mount I'll add that to the STLs in `projector-parts`. I put a magnet on the frame advancement arms wheel and a reed switch attached to the camera mount designed. The reed switch and stepper motor are connected to a CNC Shield on an Arduino, the shield being connected to a 12V supply. The Arduino connects to a Raspberry Pi via USB. The Raspberry Pi has a camera (v2) on a mount. I've added a fan to cool the DRV8825 stepper motor driver using the `V_MOT` (12V) and `GND` connections on an unpopulated driver socket.

## Software

The Arduino runs the C firmware in the `arduino` folder. The Raspberry Pi runs the Node.js project in `server` which also serves out the built code from `client`. Communication between the server and client is over a WebSocket so use a [decently modern browser](https://caniuse.com/#feat=websockets) and avoid corporate proxies as there's no fall-back mechanism.

I'm still working with the focal length and field of view of the Pi camera to maximize the amount of the sensor covering the actual film, but currently it's probably under 25%. Cropping has not been implemented yet.

The project thus far has been developed with a [black-and-white film](https://www.imdb.com/title/tt0047794/trivia?item=tr0592290) so color analysis or correction is not present though some of the camera settings can be changed by the browser interface.

I anticipate long durations for each film and I think I have a deadline so the client UI has not received as much attention as not-so-visible functionality.

## Prior Art

* https://github.com/jphfilm/rpi-film-capture uses `SLEEP` and `RESET` pins of the stepper motor driver instead of `ENABLE` which I think caused some overheating, the server would crash occasionally complaining about a GPIO configuration issue (possibly from the multi-threading?)
