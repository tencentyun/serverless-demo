#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Token utilities for message management.

This module provides token counting and message trimming utilities,
similar to the TypeScript SDK's token-utils.ts implementation.
"""

import json
from typing import Any, Dict, List, Literal, Optional, Protocol


class ITokenizer(Protocol):
    """Protocol for token counting implementations."""

    def count_tokens(self, text: str) -> int:
        """Count the number of tokens in the given text.

        :param text: The text to count tokens for
        :type text: str
        :return: Number of tokens
        :rtype: int
        """
        ...


class TiktokenTokenizer:
    """Tokenizer using tiktoken library for accurate token counting.

    This provides accurate token counts compatible with OpenAI models.

    :param model: The model name to use for tokenization (default: "gpt-4")
    :type model: str

    Example::

        tokenizer = TiktokenTokenizer(model="gpt-4")
        count = tokenizer.count_tokens("Hello, world!")
        print(f"Token count: {count}")
    """

    def __init__(self, model: str = "gpt-4"):
        """Initialize the tiktoken tokenizer.

        :param model: The model name to use for tokenization
        :type model: str
        """
        try:
            import tiktoken

            self._encoding = tiktoken.encoding_for_model(model)
        except ImportError:
            raise ImportError("tiktoken is required for TiktokenTokenizer. Install it with: pip install tiktoken")
        except Exception:
            # Fallback to cl100k_base encoding if model not found
            import tiktoken

            self._encoding = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """Count tokens using tiktoken.

        :param text: The text to count tokens for
        :type text: str
        :return: Number of tokens
        :rtype: int
        """
        return len(self._encoding.encode(text))


class SimpleTokenizer:
    """Simple tokenizer that estimates tokens based on character count.

    This is a fallback tokenizer that doesn't require external dependencies.
    It estimates approximately 4 characters per token.

    Example::

        tokenizer = SimpleTokenizer()
        count = tokenizer.count_tokens("Hello, world!")
        print(f"Estimated token count: {count}")
    """

    def __init__(self, chars_per_token: float = 4.0):
        """Initialize the simple tokenizer.

        :param chars_per_token: Average characters per token (default: 4.0)
        :type chars_per_token: float
        """
        self.chars_per_token = chars_per_token

    def count_tokens(self, text: str) -> int:
        """Estimate token count based on character count.

        :param text: The text to count tokens for
        :type text: str
        :return: Estimated number of tokens
        :rtype: int
        """
        return max(1, int(len(text) / self.chars_per_token))


class TokenTrimmer:
    """Utility class for trimming messages based on token limits.

    This class provides methods to count tokens in messages and trim
    message lists to fit within token limits.

    :param tokenizer: The tokenizer to use for counting tokens
    :type tokenizer: ITokenizer

    Example::

        tokenizer = TiktokenTokenizer()
        trimmer = TokenTrimmer(tokenizer)

        messages = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
            {"role": "user", "content": "How are you?"},
        ]

        trimmed = trimmer.trim_messages(messages, max_tokens=100)
    """

    def __init__(self, tokenizer: Optional[ITokenizer] = None):
        """Initialize the token trimmer.

        :param tokenizer: The tokenizer to use (defaults to TiktokenTokenizer)
        :type tokenizer: Optional[ITokenizer]
        """
        if tokenizer is None:
            try:
                tokenizer = TiktokenTokenizer()
            except ImportError:
                tokenizer = SimpleTokenizer()
        self.tokenizer = tokenizer

    def count_message_tokens(self, message: Dict[str, Any]) -> int:
        """Count tokens in a single message.

        :param message: The message to count tokens for
        :type message: Dict[str, Any]
        :return: Number of tokens in the message
        :rtype: int
        """
        # Count tokens in content
        content = message.get("content", "")
        if isinstance(content, str):
            token_count = self.tokenizer.count_tokens(content)
        else:
            # Handle structured content
            token_count = self.tokenizer.count_tokens(json.dumps(content))

        # Add tokens for role and other metadata (approximately 4 tokens per message)
        token_count += 4

        # Count tokens in tool calls if present
        if "tool_calls" in message:
            tool_calls = message["tool_calls"]
            if isinstance(tool_calls, list):
                for tool_call in tool_calls:
                    if isinstance(tool_call, dict):
                        token_count += self.tokenizer.count_tokens(json.dumps(tool_call))

        return token_count

    def trim_messages(
        self,
        messages: List[Dict[str, Any]],
        max_tokens: int,
        strategy: Literal["newest_first", "oldest_first"] = "newest_first",
    ) -> List[Dict[str, Any]]:
        """Trim messages to fit within token limit.

        :param messages: List of messages to trim
        :type messages: List[Dict[str, Any]]
        :param max_tokens: Maximum number of tokens allowed
        :type max_tokens: int
        :param strategy: Trimming strategy - keep newest or oldest messages
        :type strategy: Literal["newest_first", "oldest_first"]
        :return: Trimmed list of messages
        :rtype: List[Dict[str, Any]]

        Example::

            trimmer = TokenTrimmer()
            messages = [...]  # Your messages
            trimmed = trimmer.trim_messages(
                messages,
                max_tokens=1000,
                strategy="newest_first"
            )
        """
        if not messages:
            return []

        # Calculate token count for each message
        message_tokens = [self.count_message_tokens(msg) for msg in messages]

        # Determine order based on strategy
        if strategy == "newest_first":
            # Keep newest messages (from the end)
            indices = list(range(len(messages) - 1, -1, -1))
        else:
            # Keep oldest messages (from the beginning)
            indices = list(range(len(messages)))

        # Select messages that fit within token limit
        selected_indices = []
        total_tokens = 0

        for idx in indices:
            msg_tokens = message_tokens[idx]
            if total_tokens + msg_tokens <= max_tokens:
                selected_indices.append(idx)
                total_tokens += msg_tokens
            else:
                break

        # Sort indices back to original order
        selected_indices.sort()

        # Return selected messages
        return [messages[idx] for idx in selected_indices]


def count_message_tokens(
    message: Dict[str, Any],
    tokenizer: Optional[ITokenizer] = None,
) -> int:
    """Convenience function to count tokens in a message.

    :param message: The message to count tokens for
    :type message: Dict[str, Any]
    :param tokenizer: Optional tokenizer to use
    :type tokenizer: Optional[ITokenizer]
    :return: Number of tokens in the message
    :rtype: int

    Example::

        message = {"role": "user", "content": "Hello, world!"}
        count = count_message_tokens(message)
    """
    trimmer = TokenTrimmer(tokenizer)
    return trimmer.count_message_tokens(message)


def trim_messages(
    messages: List[Dict[str, Any]],
    max_tokens: int,
    strategy: Literal["newest_first", "oldest_first"] = "newest_first",
    tokenizer: Optional[ITokenizer] = None,
) -> List[Dict[str, Any]]:
    """Convenience function to trim messages to fit within token limit.

    :param messages: List of messages to trim
    :type messages: List[Dict[str, Any]]
    :param max_tokens: Maximum number of tokens allowed
    :type max_tokens: int
    :param strategy: Trimming strategy - keep newest or oldest messages
    :type strategy: Literal["newest_first", "oldest_first"]
    :param tokenizer: Optional tokenizer to use
    :type tokenizer: Optional[ITokenizer]
    :return: Trimmed list of messages
    :rtype: List[Dict[str, Any]]

    Example::

        messages = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi!"},
        ]
        trimmed = trim_messages(messages, max_tokens=100)
    """
    trimmer = TokenTrimmer(tokenizer)
    return trimmer.trim_messages(messages, max_tokens, strategy)
