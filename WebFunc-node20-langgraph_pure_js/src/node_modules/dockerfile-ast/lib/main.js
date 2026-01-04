"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerfileParser = exports.DefaultVariables = exports.Directive = exports.Keyword = exports.Workdir = exports.Volume = exports.User = exports.Stopsignal = exports.Shell = exports.Run = exports.PropertyInstruction = exports.Onbuild = exports.ModifiableInstruction = exports.Label = exports.JSONInstruction = exports.Heredoc = exports.Healthcheck = exports.From = exports.Env = exports.Entrypoint = exports.Copy = exports.Cmd = exports.Arg = exports.Add = exports.Variable = exports.Property = exports.ParserDirective = exports.Line = exports.Instruction = exports.Flag = exports.Comment = exports.JSONArgument = exports.Argument = void 0;
var argument_1 = require("./argument");
Object.defineProperty(exports, "Argument", { enumerable: true, get: function () { return argument_1.Argument; } });
var jsonArgument_1 = require("./jsonArgument");
Object.defineProperty(exports, "JSONArgument", { enumerable: true, get: function () { return jsonArgument_1.JSONArgument; } });
const comment_1 = require("./comment");
Object.defineProperty(exports, "Comment", { enumerable: true, get: function () { return comment_1.Comment; } });
const parser_1 = require("./parser");
var flag_1 = require("./flag");
Object.defineProperty(exports, "Flag", { enumerable: true, get: function () { return flag_1.Flag; } });
const instruction_1 = require("./instruction");
Object.defineProperty(exports, "Instruction", { enumerable: true, get: function () { return instruction_1.Instruction; } });
var line_1 = require("./line");
Object.defineProperty(exports, "Line", { enumerable: true, get: function () { return line_1.Line; } });
const parserDirective_1 = require("./parserDirective");
Object.defineProperty(exports, "ParserDirective", { enumerable: true, get: function () { return parserDirective_1.ParserDirective; } });
var property_1 = require("./property");
Object.defineProperty(exports, "Property", { enumerable: true, get: function () { return property_1.Property; } });
var variable_1 = require("./variable");
Object.defineProperty(exports, "Variable", { enumerable: true, get: function () { return variable_1.Variable; } });
var add_1 = require("./instructions/add");
Object.defineProperty(exports, "Add", { enumerable: true, get: function () { return add_1.Add; } });
const arg_1 = require("./instructions/arg");
Object.defineProperty(exports, "Arg", { enumerable: true, get: function () { return arg_1.Arg; } });
const cmd_1 = require("./instructions/cmd");
Object.defineProperty(exports, "Cmd", { enumerable: true, get: function () { return cmd_1.Cmd; } });
const copy_1 = require("./instructions/copy");
Object.defineProperty(exports, "Copy", { enumerable: true, get: function () { return copy_1.Copy; } });
const entrypoint_1 = require("./instructions/entrypoint");
Object.defineProperty(exports, "Entrypoint", { enumerable: true, get: function () { return entrypoint_1.Entrypoint; } });
const env_1 = require("./instructions/env");
Object.defineProperty(exports, "Env", { enumerable: true, get: function () { return env_1.Env; } });
const from_1 = require("./instructions/from");
Object.defineProperty(exports, "From", { enumerable: true, get: function () { return from_1.From; } });
const healthcheck_1 = require("./instructions/healthcheck");
Object.defineProperty(exports, "Healthcheck", { enumerable: true, get: function () { return healthcheck_1.Healthcheck; } });
var heredoc_1 = require("./heredoc");
Object.defineProperty(exports, "Heredoc", { enumerable: true, get: function () { return heredoc_1.Heredoc; } });
var jsonInstruction_1 = require("./jsonInstruction");
Object.defineProperty(exports, "JSONInstruction", { enumerable: true, get: function () { return jsonInstruction_1.JSONInstruction; } });
var label_1 = require("./instructions/label");
Object.defineProperty(exports, "Label", { enumerable: true, get: function () { return label_1.Label; } });
var modifiableInstruction_1 = require("./modifiableInstruction");
Object.defineProperty(exports, "ModifiableInstruction", { enumerable: true, get: function () { return modifiableInstruction_1.ModifiableInstruction; } });
var onbuild_1 = require("./instructions/onbuild");
Object.defineProperty(exports, "Onbuild", { enumerable: true, get: function () { return onbuild_1.Onbuild; } });
var propertyInstruction_1 = require("./propertyInstruction");
Object.defineProperty(exports, "PropertyInstruction", { enumerable: true, get: function () { return propertyInstruction_1.PropertyInstruction; } });
var run_1 = require("./instructions/run");
Object.defineProperty(exports, "Run", { enumerable: true, get: function () { return run_1.Run; } });
var shell_1 = require("./instructions/shell");
Object.defineProperty(exports, "Shell", { enumerable: true, get: function () { return shell_1.Shell; } });
var stopsignal_1 = require("./instructions/stopsignal");
Object.defineProperty(exports, "Stopsignal", { enumerable: true, get: function () { return stopsignal_1.Stopsignal; } });
var user_1 = require("./instructions/user");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_1.User; } });
var volume_1 = require("./instructions/volume");
Object.defineProperty(exports, "Volume", { enumerable: true, get: function () { return volume_1.Volume; } });
const workdir_1 = require("./instructions/workdir");
Object.defineProperty(exports, "Workdir", { enumerable: true, get: function () { return workdir_1.Workdir; } });
var Keyword;
(function (Keyword) {
    Keyword["ADD"] = "ADD";
    Keyword["ARG"] = "ARG";
    Keyword["CMD"] = "CMD";
    Keyword["COPY"] = "COPY";
    Keyword["ENTRYPOINT"] = "ENTRYPOINT";
    Keyword["ENV"] = "ENV";
    Keyword["EXPOSE"] = "EXPOSE";
    Keyword["FROM"] = "FROM";
    Keyword["HEALTHCHECK"] = "HEALTHCHECK";
    Keyword["LABEL"] = "LABEL";
    Keyword["MAINTAINER"] = "MAINTAINER";
    Keyword["ONBUILD"] = "ONBUILD";
    Keyword["RUN"] = "RUN";
    Keyword["SHELL"] = "SHELL";
    Keyword["STOPSIGNAL"] = "STOPSIGNAL";
    Keyword["USER"] = "USER";
    Keyword["VOLUME"] = "VOLUME";
    Keyword["WORKDIR"] = "WORKDIR";
})(Keyword || (exports.Keyword = Keyword = {}));
var Directive;
(function (Directive) {
    Directive["escape"] = "escape";
    Directive["syntax"] = "syntax";
})(Directive || (exports.Directive = Directive = {}));
exports.DefaultVariables = [
    "ALL_PROXY", "all_proxy",
    "FTP_PROXY", "ftp_proxy",
    "HTTP_PROXY", "http_proxy",
    "HTTPS_PROXY", "https_proxy",
    "NO_PROXY", "no_proxy"
];
var DockerfileParser;
(function (DockerfileParser) {
    function parse(content) {
        let parser = new parser_1.Parser();
        return parser.parse(content);
    }
    DockerfileParser.parse = parse;
})(DockerfileParser || (exports.DockerfileParser = DockerfileParser = {}));
