from unittest import TestCase
from index import split_group


class Test(TestCase):
    def test_split_group(self):
        text_list = [
            "1234567890",
            "1234567891",
            "1234567892",
            "1234567893",
            "1234567894",
            "1234567895",
            "1234567896",
            "1234567897",
            "1234567898",
            "1234567899",
        ]
        groups = split_group([], None)
        self.assertEqual(len(groups), 0, "没有数据列表， 返回空group 1")

        groups = split_group([], 20)
        self.assertEqual(len(groups), 0, "没有数据列表， 返回空group 2")

        groups = split_group(text_list, None)
        self.assertEqual(len(groups), 1, "不指定文件大小， 不拆分")

        groups = split_group(text_list, 0)
        self.assertEqual(len(groups), 1, "指定文件大小为0， 不拆分")

        groups = split_group(text_list, 5)
        self.assertEqual(len(groups), 10, "文件大小小于单个字符串大小时，不拆分")

        groups = split_group(text_list, 10)
        self.assertEqual(len(groups), 10, "期望拆成10组")

        groups = split_group(text_list, 20)
        self.assertEqual(len(groups), 5, "期望拆成5组")

        groups = split_group(text_list, 95)
        self.assertEqual(len(groups), 2, "期望拆成2组")
        self.assertEqual(groups[1], ["1234567899", ], "最后一个group只有一条数据")

        groups = split_group(text_list, 100)
        self.assertEqual(len(groups), 1, "期望拆成1组")

        groups = split_group(text_list, 105)
        self.assertEqual(len(groups), 1, "总大小 100小于105， 但是还是需要分成一组")
