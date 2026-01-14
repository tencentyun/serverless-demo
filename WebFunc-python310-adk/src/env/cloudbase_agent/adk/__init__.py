#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cloudbase Agent ADK Integration.

This module provides integration between Cloudbase Agent and Google ADK (Agent Development Kit).
It wraps Google ADK agents to work seamlessly with the Cloudbase Agent framework, providing
AG-UI protocol support, session management, and integration with Cloudbase Agent Server.
"""

from .agent import ADKAgent

__all__ = ["ADKAgent"]
