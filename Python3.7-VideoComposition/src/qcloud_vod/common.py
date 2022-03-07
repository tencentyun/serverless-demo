import os


class StringUtil(object):
    @staticmethod
    def is_empty(target):
        return target is None or target == ""

    @staticmethod
    def is_not_empty(target):
        return not StringUtil.is_empty(target)


class FileUtil(object):
    @staticmethod
    def is_file_exist(target):
        return os.path.isfile(target)

    @staticmethod
    def get_file_type(target):
        info = os.path.splitext(target)
        if info[-1] == "":
            return ""
        return info[-1][1:]

    @staticmethod
    def get_file_name(target):
        path_info = os.path.split(target)
        info = os.path.splitext(path_info[-1])
        return info[0]

    @staticmethod
    def join_path(base_path, *path_list):
        result_path = base_path
        if len(base_path) > 0 and (base_path[-1:] == "/" or base_path[-1:] == "\\"):
            result_path = result_path[:-1]
        for p in path_list:
            if len(p) > 0 and (p[0] == "/" or p[0] == "\\"):
                result_path += p
            else:
                result_path += "/" + p
        return result_path
