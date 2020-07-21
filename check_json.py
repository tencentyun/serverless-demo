import json
import re
import os

def json_minify(string, strip_space=True):
    tokenizer = re.compile('"|(/\*)|(\*/)|(//)|\n|\r')
    end_slashes_re = re.compile(r'(\\)*$')

    in_string = False
    in_multi = False
    in_single = False

    new_str = []
    index = 0

    for match in re.finditer(tokenizer, string):

        if not (in_multi or in_single):
            tmp = string[index:match.start()]
            if not in_string and strip_space:
                # replace white space as defined in standard
                tmp = re.sub('[ \t\n\r]+', '', tmp)
            new_str.append(tmp)
        elif not strip_space:
            # Replace comments with white space so that the JSON parser reports
            # the correct column numbers on parsing errors.
            new_str.append(' ' * (match.start() - index))

        index = match.end()
        val = match.group()

        if val == '"' and not (in_multi or in_single):
            escaped = end_slashes_re.search(string, 0, match.start())

            # start of string or unescaped quote character to end string
            if not in_string or (escaped is None or len(escaped.group()) % 2 == 0):  # noqa
                in_string = not in_string
            index -= 1  # include " character in next catch
        elif not (in_string or in_multi or in_single):
            if val == '/*':
                in_multi = True
            elif val == '//':
                in_single = True
        elif val == '*/' and in_multi and not (in_string or in_single):
            in_multi = False
            if not strip_space:
                new_str.append(' ' * len(val))
        elif val in '\r\n' and not (in_multi or in_string) and in_single:
            in_single = False
        elif not ((in_multi or in_single) or (val in ' \r\n\t' and strip_space)):  # noqa
            new_str.append(val)

        if not strip_space:
            if val in '\r\n':
                new_str.append(val)
            elif in_multi or in_single:
                new_str.append(' ' * len(val))

    new_str.append(string[index:])
    return ''.join(new_str)


if __name__ == '__main__':
    demo_path = os.getcwd()
    sub_dirs = os.listdir(demo_path)
    for sub_dir in sub_dirs:
        if sub_dir.startswith('.') is False and os.path.isdir(os.path.join(demo_path, sub_dir)) is True:
            startdir = os.path.join(demo_path, sub_dir)
            try:
                f = open(startdir + "/config.json", 'r')
                json.loads(json_minify(f.read()))
                f.close()
            except Exception, e:
                print sub_dir.center(50, ' ') + "json is illegal, reason is {0}".format(e)
            else:
                print sub_dir.center(50, ' ') + "json is legal"