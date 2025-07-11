import sys
import os

# API dosyasının bulunduğu dizini Python yoluna ekle
project_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_path)

# API'yi import et
from api import app as application

# PythonAnywhere WSGI kullanımı için
if __name__ == '__main__':
    application.run() 