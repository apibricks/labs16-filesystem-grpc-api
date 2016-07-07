var fs = require('fs')
var grpc = require('grpc')
var Ansible = require('node-ansible')
var uuid = require('uuid')
var tar = require('tar')

var PROTO_PATH = __dirname + '/fs.proto'
var fs_proto = grpc.load(PROTO_PATH).fs;

var SSH_HOST = process.env.SSH_HOST
var SSH_PORT = process.env.SSH_PORT || '22'
var SSH_USER = process.env.SSH_USER
var SSH_KEY = process.env.SSH_KEY
var CHROOT = process.env.BASE_PATH
var SUDO = process.env.SUDO
var SUDO_PASS = process.env.SUDO_PASSWORD
var SUDO_USER = process.env.SUDO_USER
var ALLOW_EXEC = process.env.ALLOW_EXEC
var ALLOW_OVERRIDE_CONFIG = process.env.ALLOW_OVERRIDE_CONFIG
var CONNECTION = 'local'
if (SSH_HOST) {
  CONNECTION = 'ssh'
} else {
  SSH_HOSt = '127.0.0.1'
}



// HELPER FUNCTIONS

function runExistingPlaybook(playbookName, variables, write) {
  return new Promise((resolve, reject) => {
    var playbook = new Ansible.Playbook().playbook(playbookName).variables(variables);
    playbook.on('stdout', function(data) { write(data.toString()) })
    playbook.on('stderr', function(data) { write(data.toString()) })
    playbook.on('close', function(data) {
      resolve()
    })
    playbook.exec()
  })
}

function runExistingPlaybookSync(playbookName, variables) {
  return new Ansible.Playbook().playbook(playbookName).variables(variables).exec();
}

function abortCall(call){
  return function(err){
    console.log(err)
    call.status.code = grpc.status.INTERNAL
    if(err.message) call.status.details = err.message
    call.end()
  }
}


function extractOutput(output) {
  var pattern =  /"res": ({[\s\S]*})\n}/
  var result = output.match(pattern);
  return JSON.parse(result[1]);
}

function constructCommand(command, env) {
  var vars = '';
  var keys = Object.keys(env).forEach(key => {
    vars += key + '=' + env[key] + ' ';
  });
  console.log('vars: ', vars);
  return command;
}

function returnErrorCallback(callback, err) {
  console.error('ERROR: ', err);
  callback({code: grpc.status.INTERNAL, details: err});
}


function parseExistsOutput(output) {
  path = {}
  if (output.indexOf('"exists": false') > -1) {
    path['type'] = 'NONE';
  } else if (output.indexOf('"isreg": true') > -1) {
    path['type'] = 'FILE';
  } else if (output.indexOf('"isdir": true') > -1) {
    path['type'] = 'DIR';
  } else if (output.indexOf('"islnk": true') > -1) {
    path['type'] = 'LINK';
  }
  return path;
}

function moveToRemoteServer(callback, src, dest) {
  runExistingPlaybookSync('moveToServer',
    {HOST: '127.0.0.1',
     EXECUTE_AS_SUDO: 'false',
     REMOTE_USER: '',
     SRC_PATH: src,
     DST_PATH: dest
    }).then(result => {
      console.log(result.code);
      console.log(result.output);
      callback(null, {})
    }, err => {
      returnErrorCallback(callback, err);
    })
}

function moveToLocalServer(callback, src, dest) {
  runExistingPlaybookSync('move',
    {HOST: '127.0.0.1',
     EXECUTE_AS_SUDO: 'false',
     REMOTE_USER: '',
     CONNECTION: 'local',
     SRC_PATH: src,
     DST_PATH: dest
    }).then(result => {
      console.log(result.code);
      console.log(result.output);
      callback(null, {})
    }, err => {
      returnErrorCallback(callback, err);
    })

}

// RPC CALLS
function createFile(call, callback) {
  runExistingPlaybookSync('createFile',
    {HOST: '127.0.0.1',
     EXECUTE_AS_SUDO: 'false',
     REMOTE_USER: '',
     CONNECTION: 'local',
     PATH: call.request.path
    }).then(result => {
      console.log(result.code);
      console.log(result.output);
      callback(null, {})
    }, err => {
      returnErrorCallback(callback, err);
    })
}

function createDir(call, callback) {
  runExistingPlaybookSync('createDir',
    {HOST: '127.0.0.1',
     EXECUTE_AS_SUDO: 'false',
     REMOTE_USER: '',
     CONNECTION: 'local',
     PATH: call.request.path
    }).then(result => {
      console.log(result.code);
      console.log(result.output);
      callback(null, {})
    }, err => {
      returnErrorCallback(callback, err);
    })
}

function copy(call, callback) {
  if (call.request.paths.length != 2) {
    callback({code: grpc.status.INTERNAL, details: '2 paths required'});
    return;
  }
  runExistingPlaybookSync('copy',
    {HOST: '127.0.0.1',
     EXECUTE_AS_SUDO: 'false',
     REMOTE_USER: '',
     CONNECTION: 'local',
     SRC_PATH: call.request.paths[0].path,
     DST_PATH: call.request.paths[1].path
    }).then(result => {
      console.log(result.code);
      console.log(result.output);
      callback(null, {})
    }, err => {
      returnErrorCallback(callback, err);
    })
}

function move(call, callback) {
  if (call.request.paths.length != 2) {
    callback({code: grpc.status.INTERNAL, details: '2 paths required'});
    return;
  }
  runExistingPlaybookSync('move',
    {HOST: '127.0.0.1',
     EXECUTE_AS_SUDO: 'false',
     REMOTE_USER: '',
     CONNECTION: 'local',
     SRC_PATH: call.request.paths[0].path,
     DST_PATH: call.request.paths[1].path
    }).then(result => {
      console.log(result.code);
      console.log(result.output);
      callback(null, {})
    }, err => {
      returnErrorCallback(callback, err);
    })
}

function deletePaths(call, callback) {
  runExistingPlaybookSync('delete',
    {HOST: '127.0.0.1',
     EXECUTE_AS_SUDO: 'false',
     REMOTE_USER: '',
     CONNECTION: 'local',
     PATH: call.request.paths[0].path
    }).then(result => {
      console.log(result.code);
      console.log(result.output);
      callback(null, {})
    }, err => {
      returnErrorCallback(callback, err);
    })
}

function exists(call, callback) {
  runExistingPlaybookSync('exists',
    {HOST: '127.0.0.1',
     EXECUTE_AS_SUDO: 'false',
     REMOTE_USER: '',
     CONNECTION: 'local',
     PATH: call.request.path
    }).then(result => {
      console.log(result.code);
      console.log(result.output);
      res = parseExistsOutput(result.output);
      res['path'] = call.request.path;
      callback(null, res);
    }, err => {
      returnErrorCallback(callback, err);
    })
}

function readFile(call) {
  abortCall(call);
}

function writeFile(call, callback) {
  // write file to local disk
  filename = '/tmp/' + uuid.v1();
  file = null;
  var remotePath = '';
  call.on('data', data => {
    var content = data.content.data;
    if (file == null && data.path.path) {
      file = fs.createWriteStream(filename);
      remotePath = data.path.path;
    }
    file.write(content);
  });
  call.on('end', () => {
    file.end();
    if (false) {
      moveToRemoteServer(callback, filename, remotePath);
    } else {
      moveToLocalServer(callback, filename, remotePath);
    }
  });
  call.on('error', err => { returnErrorCallback(callback, err); });
}

function readDir(call) {
  abortCall(call);
}

function writeDir(call, callback) {
  // write dir to local disk
  filename = '/tmp/' + uuid.v1() + '.tar';
  file = fs.createWriteStream(filename);
  var remotePath = '';
  call.on('data', data => {
    var content = data.content.data;
    if (data.path && data.path.path) {
      remotePath = data.path.path;
    }
    file.write(content);
  });
  call.on('end', () => { file.end(); });
  file.on('close', () => {
    console.log('extracting');
    fs.createReadStream(filename)
      .on('error', err => {console.error('Err: ', err);})
      .pipe(tar.Extract({path:path})
          .on('error', err => {console.error('Err: ', err);})
          .on('end', () => {
            console.log('Extracted');
            if (false) {
              moveToRemoteServer(callback, filename, remotePath);
            } else {
              moveToLocalServer(callback, filename, remotePath);
            }
          }));
  });
  call.on('error', err => { returnErrorCallback(callback, err); });
}

function exec(call, callback) {
  if (! ALLOW_EXEC) {
    callback({code: grpc.status.INTERNAL, details: 'execution of commands not allowed'});
    return;
  }
  var cwd = '';
  if (call.request.cwd && call.request.cwd.path) {
    cwd = call.request.cwd.path;
  } else {
    cwd = '~';
  }
  runExistingPlaybookSync('exec',
    {HOST: '127.0.0.1',
     EXECUTE_AS_SUDO: 'false',
     REMOTE_USER: '',
     CONNECTION: 'local',
     COMMAND: constructCommand(call.request.command, call.request.env),
     CWD: cwd
    }).then(result => {
      console.log(result.code);
      console.log(result.output);
      res = extractOutput(result.output);
      callback(null, {stdout:res.stdout, stderr:res.stderr, code:res.rc})
    }, err => {
      returnErrorCallback(callback, err);
    })
}

function execStream(call) {
  abortCall(call);
}

var server = new grpc.Server()
server.addProtoService(fs_proto.FileSystem.service, {
  createDir: createDir,
  createFile: createFile,
  copy: copy,
  move: move,
  deletePaths: deletePaths,
  exists: exists,
  readFile: readFile,
  writeFile: writeFile,
  readDir: readDir,
  writeDir: writeDir,
  exec: exec,
  execStream: execStream
})
server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure())
server.start()
