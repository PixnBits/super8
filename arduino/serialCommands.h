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
};

struct serialCommand {
  serialCommandCode code;
  float speed;
};

#endif SERIAL_COMMANDS
