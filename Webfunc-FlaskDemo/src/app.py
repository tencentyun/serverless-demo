import os
from flask import Flask, jsonify, render_template, request, url_for, send_from_directory
from werkzeug.utils import secure_filename

IS_SERVERLESS = bool(os.environ.get('SERVERLESS'))
print(IS_SERVERLESS)

app = Flask(__name__)
# 初始化上传临时目录
def init_upload_dir():
  UPLOAD_DIR = '/tmp/uploads' if IS_SERVERLESS else os.getcwd() + '/uploads'
  if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
  app.config['UPLOAD_DIR'] = UPLOAD_DIR

init_upload_dir()

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/users", methods=['GET', 'POST'])
def users():
    if request.method == 'POST':
      print(request.form)
      uid = request.form.get('uid');
      user = {'uid': uid, 'name': 'test1'}
      return jsonify(data=user)
    else:
      limit = request.args.get('limit')
      data = {
        'count': limit or 2,
        'users': [{'name': 'test1'}, {'name': 'test2'}]
      }
      return jsonify(data=data)

@app.route("/users/<id>")
def get_user(id):
    return jsonify(data={'name': 'test1'})

# 上传文件示例
@app.route('/upload',methods=['POST'])
def upload():
  if request.method == 'POST':
    if 'avatar' not in request.files:
      res = {"error": "No avatar file upload"}
      return jsonify(data=res)
    avatar = request.files['avatar']

    if avatar.filename == '':
      res = {"error": "No avatar file selected"}
      return jsonify(data=res)

    if avatar:
      filename = secure_filename(avatar.filename);
      filePath = os.path.join(app.config['UPLOAD_DIR'], filename)
      avatar.save(filePath)
      uploadUrl = url_for('uploaded_file', filename=filename)
      res = {'upload': uploadUrl}
      return jsonify(data=res)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_DIR'], filename)

# 启动服务，监听 9000 端口，监听地址为 0.0.0.0
app.run(debug=IS_SERVERLESS != True, port=9000, host='0.0.0.0')
