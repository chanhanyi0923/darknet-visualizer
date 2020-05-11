import re
import json
import os
import shutil
import subprocess
import signal

from flask import Flask, escape, request, jsonify

app = Flask(__name__)
darknet_log_regex = re.compile(r'([0-9]+): ([.\-+eE0-9]+), ([.\-+eE0-9]+) avg, ([.\-+eE0-9]+) rate, ([.\-+eE0-9]+) seconds, ([0-9]+) images')

# @app.route('/')
# def hello():
#     name = request.args.get("name", "World")
#     return 'Hello, {escape(name)}!'

# @app.route('/test/model/<folder_id>', methods=['POST'])
# def test_model(folder_id):
#     cmd = './darknet yolo test cfg/yolo.cfg <path>/yolo.weights <image>'
#     return 'success'

@app.route('/stop/training/<pid>', methods=['POST'])
def stop_training(pid):
    pid_int = int(pid)
    os.kill(pid_int, signal.SIGKILL)
    return 'success'

@app.route('/train/<folder_id>', methods=['POST'])
def train(folder_id):
    dataset_path = '../dataset/config.data'
    path = os.getcwd() + '/../' + str(folder_id)
    with open(path + '/stdout.txt', 'a+') as out:
        with open(path + '/stderr.txt', 'a+') as err:
            cmd = ['./darknet', 'detector', 'train', dataset_path, 'config.cfg']
            p = subprocess.Popen(args=cmd, cwd=path, close_fds=True, preexec_fn = os.setsid, stdout=out, stderr=err)
            return str(p.pid)
    return 'failed'
    # process = subprocess.Popen(path + ' > /dev/null 2> /dev/null &', shell=True)

@app.route('/cfg/<folder_id>', methods=['POST'])
def save_cfg(folder_id):
    data = request.form.get('data')
    path = '../' + str(folder_id) + '/config.cfg'
    with open(path, 'w') as f:
        f.write(data)
    return 'success'

@app.route('/create/<folder_id>', methods=['POST'])
def create(folder_id):
    try:
        path = '../' + str(folder_id)
        os.mkdir(path)
        os.mkdir(path + '/backup')
        shutil.copyfile('../darknet/darknet', path + '/darknet')
        os.chmod(path + '/darknet', 0o777)
    except:
        return 'failed'
    return 'success'

@app.route('/log/<folder_id>', methods=['GET'])
def get_log(folder_id):
    plot = []
    path = '../' + folder_id + '/stdout.txt'
    with open(path, 'r') as f:
        lines = f.readlines()
        for line in lines:
            result = darknet_log_regex.match(line)
            if result is not None:
                iter_num, loss, avg_loss, learning_rate, total_time, images = result.groups()
                plot.append({
                    'iter_num': iter_num,
                    'loss': loss,
                    'avg_loss': avg_loss,
                    'learning_rate': learning_rate,
                    'total_time': total_time,
                    'images': images
                })
    return jsonify(plot)

if __name__ == '__main__':
      app.run(host='0.0.0.0', port=23132)
