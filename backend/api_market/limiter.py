from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared Limiter instance. slowapi's @limiter.limit() decorator records
# route limits on whichever Limiter object is used, then enforces them
# at request time by looking up `request.app.state.limiter`. If every
# router builds its own local Limiter (and `app.state.limiter` is never
# set) the decorator silently no-ops. A single shared instance +
# attach in `create_app` is the documented wiring.
limiter = Limiter(key_func=get_remote_address)
