"""Formatters for the two audiences: a person at a terminal, and a machine.

The JSON formatter is stdlib rather than python-json-logger. It is a dozen
lines, and #92 is open on dependency hygiene — a dependency that ships log
output straight to production is not worth adding for this much code.
"""

import json
import logging

# Attributes LogRecord always carries. Anything else on a record was put there
# deliberately by a filter or an `extra=` argument, so it belongs in the output.
_STANDARD_ATTRS = frozenset(
    {
        "args",
        "asctime",
        "created",
        "exc_info",
        "exc_text",
        "filename",
        "funcName",
        "levelname",
        "levelno",
        "lineno",
        "message",
        "module",
        "msecs",
        "msg",
        "name",
        "pathname",
        "process",
        "processName",
        "relativeCreated",
        "stack_info",
        "taskName",
        "thread",
        "threadName",
    }
)


class JSONFormatter(logging.Formatter):
    """One JSON object per line, for `journalctl -o json` and log queries."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        if record.stack_info:
            payload["stack"] = self.formatStack(record.stack_info)

        for key, value in record.__dict__.items():
            if key not in _STANDARD_ATTRS and not key.startswith("_"):
                payload[key] = value

        # default=str so an unserialisable extra degrades to its repr rather
        # than raising inside the logging call that was meant to help.
        return json.dumps(payload, default=str, ensure_ascii=False)
