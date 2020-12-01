import time
import logging
import psycopg2
from io import IOBase

logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

class CDWClient(object):
    
    def __init__(self, host:str, user: str, password: str, port: int, database: str, statement_timeout: int):
        self.host = host
        self.user = user
        self.password = password
        self.port = port
        self.database = database
        self.statement_timeout = statement_timeout

    def get_connection(self):
        timeout_str = '-c statement_timeout=' + str(self.statement_timeout) + 's'
        conn = psycopg2.connect(database = self.database,
                                user = self.user,
                                password = self.password,
                                host = self.host,
                                port = self.port,
                                connect_timeout=5,
                                options=timeout_str)
        return conn


    def copy_from(self, sio: IOBase, table: str, sep: str, fnull: str):
        conn = None
        cur = None
        try:
            start_time = int(time.time())

            conn = self.get_connection()
            cur = conn.cursor()
            cur.copy_from(sio, table, sep, fnull)
            conn.commit()

            logger.info("copy table:[%s] success, cost time :[%ds]", table, int(time.time()) - start_time)
            return True
        except Exception as e:
            logger.error("copy table:[%s] fail, cost time :[%ds], error msg:[%s]", table, int(time.time()) - start_time, e)
            return False
        finally:
            if cur is not None:
                cur.close()
            if conn is not None:
                conn.close()