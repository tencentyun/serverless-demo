# -*- coding: utf-8 -*-
"""
    flask
    ~~~~~

    A microframework based on Werkzeug.  It's extensively documented
    and follows best practice patterns.

    :copyright: © 2010 by the Pallets team.
    :license: BSD, see LICENSE for more details.
"""

__version__ = '1.0.2'

# utilities we import from Werkzeug and Jinja2 that are unused
# in the module but are exported as public interface.

# the signals

# We're not exposing the actual json module but a convenient wrapper around
# it.
from . import json

# This was the only thing that Flask used to export at one point and it had
# a more generic name.
jsonify = json.jsonify

# backwards compat, goes away in 1.0
json_available = True
