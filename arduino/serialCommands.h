#ifndef SERIAL_COMMANDS
#define SERIAL_COMMANDS

enum serialCommandCode {
  NONE,
  STOP,
  PRINT_INFO,
  ADVANCE_FRAME,
  REVERSE_FRAME,
  ADVANCE,
  REVERSE,
  SET_ADVANCE_SPEED,
  LAMP_ACTIVATE,
  LAMP_DEACTIVATE,
  SET_LAMP_BRIGHTNESS,
};

struct serialCommand {
  serialCommandCode code;
  float speed;
  int brightness;
};

#endif SERIAL_COMMANDS
