# coding=utf-8

import os
import xlwt
import sys

pathDir = os.listdir(sys.path[0])
#print len(pathDir)
#print pathDir

def data_write(file_path, datas):
    f = xlwt.Workbook()
    sheet1 = f.add_sheet(u'sheet1', cell_overwrite_ok = True)

    i = 0
    print len(datas)
    for data in datas:
        print data
        for i in range(len(datas)):
            print i
            sheet1.write(i, 1, datas[i])
        # i = i + 1
    
    f.save(file_path)

data_write('listdemoname.xls', pathDir)
#print pathDir