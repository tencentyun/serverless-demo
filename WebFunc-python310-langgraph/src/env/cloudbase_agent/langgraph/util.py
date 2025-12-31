#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LangGraph utility functions for Cloudbase Agent.

This module provides utilities to convert AG-UI actions to LangChain tools,
including JSON Schema to Pydantic model conversion.
"""

from typing import Any, Dict, List, Optional, Type

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field, create_model


def convert_actions_to_dynamic_structured_tools(actions: List[Dict[str, Any]]) -> List[StructuredTool]:
    """Convert multiple AG-UI actions to LangChain DynamicStructuredTools.

    :param actions: List of action definitions from AG-UI
    :type actions: List[Dict[str, Any]]
    :return: List of LangChain StructuredTool instances
    :rtype: List[StructuredTool]

    Example::

        actions = [
            {
                "name": "search",
                "description": "Search the web",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"}
                    },
                    "required": ["query"]
                }
            }
        ]

        tools = convert_actions_to_dynamic_structured_tools(actions)
    """
    return [convert_action_to_dynamic_structured_tool(action) for action in actions]


def convert_action_to_dynamic_structured_tool(action_input: Dict[str, Any]) -> StructuredTool:
    """Convert a single AG-UI action to LangChain DynamicStructuredTool.

    :param action_input: Action definition from AG-UI with name, description, and parameters
    :type action_input: Dict[str, Any]
    :return: LangChain StructuredTool instance
    :rtype: StructuredTool

    Example::

        action = {
            "name": "calculator",
            "description": "Perform calculations",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Math expression"}
                },
                "required": ["expression"]
            }
        }

        tool = convert_action_to_dynamic_structured_tool(action)
    """
    name = action_input.get("name", "unknown_tool")
    description = action_input.get("description", "")
    parameters = action_input.get("parameters", {})

    # Convert JSON Schema to Pydantic model
    schema = convert_json_schema_to_pydantic_model(parameters, model_name=f"{name.title().replace('_', '')}Input")

    # Create a dummy function (actual implementation will be provided by AG-UI)
    async def func(**kwargs: Any) -> str:
        """Placeholder function for AG-UI tool execution."""
        return ""

    return StructuredTool(
        name=name,
        description=description,
        args_schema=schema,
        coroutine=func,
    )


def convert_json_schema_to_pydantic_model(
    json_schema: Dict[str, Any], model_name: str = "DynamicModel", required: bool = True
) -> Type[BaseModel]:
    """Convert JSON Schema to Pydantic model.

    This function recursively converts JSON Schema definitions to Pydantic
    model classes, handling nested objects, arrays, and various data types.

    :param json_schema: JSON Schema definition
    :type json_schema: Dict[str, Any]
    :param model_name: Name for the generated Pydantic model
    :type model_name: str
    :param required: Whether the field is required
    :type required: bool
    :return: Pydantic model class
    :rtype: Type[BaseModel]

    Example::

        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "User name"},
                "age": {"type": "number", "description": "User age"}
            },
            "required": ["name"]
        }

        Model = convert_json_schema_to_pydantic_model(schema, "UserInput")
        instance = Model(name="Alice", age=30)
    """
    schema_type = json_schema.get("type", "object")

    if schema_type == "object":
        properties = json_schema.get("properties", {})
        required_fields = json_schema.get("required", [])
        description = json_schema.get("description", "")

        # If no properties, return empty model
        if not properties:
            return create_model(model_name, __doc__=description)

        # Build field definitions
        field_definitions: Dict[str, Any] = {}

        for field_name, field_schema in properties.items():
            is_required = field_name in required_fields
            field_type = _convert_json_schema_type_to_python_type(
                field_schema, is_required, f"{model_name}{field_name.title()}"
            )
            field_description = field_schema.get("description", "")

            if is_required:
                field_definitions[field_name] = (field_type, Field(..., description=field_description))
            else:
                field_definitions[field_name] = (Optional[field_type], Field(None, description=field_description))

        return create_model(model_name, **field_definitions, __doc__=description)

    else:
        # For non-object types, create a simple model with single field
        field_type = _convert_json_schema_type_to_python_type(json_schema, required, model_name)
        description = json_schema.get("description", "")

        if required:
            field_definitions = {"value": (field_type, Field(..., description=description))}
        else:
            field_definitions = {"value": (Optional[field_type], Field(None, description=description))}

        return create_model(model_name, **field_definitions)


def _convert_json_schema_type_to_python_type(json_schema: Dict[str, Any], required: bool, model_name: str) -> Any:
    """Convert JSON Schema type to Python type annotation.

    :param json_schema: JSON Schema definition
    :type json_schema: Dict[str, Any]
    :param required: Whether the field is required
    :type required: bool
    :param model_name: Name for nested models
    :type model_name: str
    :return: Python type annotation
    :rtype: Any
    """
    schema_type = json_schema.get("type")

    if schema_type == "string":
        return str
    elif schema_type == "number":
        return float
    elif schema_type == "integer":
        return int
    elif schema_type == "boolean":
        return bool
    elif schema_type == "array":
        items_schema = json_schema.get("items", {})
        item_type = _convert_json_schema_type_to_python_type(items_schema, True, f"{model_name}Item")
        return List[item_type]
    elif schema_type == "object":
        # Recursively create nested model
        return convert_json_schema_to_pydantic_model(json_schema, model_name, required)
    else:
        # Default to Any for unknown types
        return Any


def convert_pydantic_model_to_json_schema(model: Type[BaseModel], include_description: bool = True) -> Dict[str, Any]:
    """Convert Pydantic model to JSON Schema.

    This is the reverse operation of convert_json_schema_to_pydantic_model.

    :param model: Pydantic model class
    :type model: Type[BaseModel]
    :param include_description: Whether to include field descriptions
    :type include_description: bool
    :return: JSON Schema definition
    :rtype: Dict[str, Any]

    Example::

        from pydantic import BaseModel, Field

        class UserInput(BaseModel):
            name: str = Field(description="User name")
            age: int = Field(description="User age")

        schema = convert_pydantic_model_to_json_schema(UserInput)
    """
    return model.model_json_schema()
