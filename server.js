var fs = require('fs')
var grpc = require('grpc')
var Ansible = require('node-ansible')
var uuid = require('uuid')
var tar = require('tar')

var PROTO_PATH = __dirname + '/fs.proto'
var fs_proto = grpc.load(PROTO_PATH).fs;


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

function constructCommand(command, env) {
  return command;
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
      console.error(err);
      callback(null, {})
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
      console.error(err);
      callback(null, {})
    })
}

function copy(call, callback) {
  if (call.request.paths.length != 2) {
    callback(null, {});
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
      console.error(err);
      callback(null, {})
    })
}

function move(call, callback) {
  if (call.request.paths.length != 2) {
    callback(null, {});
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
      console.error(err);
      callback(null, {})
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
      console.error(err);
      callback(null, {})
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
      console.error('error: ', err);
      callback(null, {})
    })
}

function readFile(call) {
  abortCall(call);
}

function writeFile(call, callback) {
  // write file to local disk
  file = null;
  call.on('data', data => {
    var content = data.content.data;
    if (file == null && data.path.path) {
      file = fs.createWriteStream(data.path.path);
    }
    file.write(content);
  });
  call.on('end', () => { file.end(); callback(null, {}); });
  call.on('error', err => { callback(null, {}); });
}

function readDir(call) {
  abortCall(call);
}

function writeDir(call, callback) {
  // write dir to local disk
  filename = '/tmp/' + uuid.v1() + '.tar';
  file = fs.createWriteStream(filename);
  var path = '';
  call.on('data', data => {
    var content = data.content.data;
    if (data.path && data.path.path) {
      path = data.path.path;
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
          .on('end', () => {console.log('Extracted');callback(null, {});}));
  });
  call.on('error', err => { callback(null, {});});
}

function exec(call, callback) {
  runExistingPlaybookSync('exec',
    {HOST: '127.0.0.1',
     EXECUTE_AS_SUDO: 'false',
     REMOTE_USER: '',
     CONNECTION: 'local',
     COMMAND: constructCommand(call.request.command, call.request.env),
     CWD: call.request.cwd.path
    }).then(result => {
      console.log(result.code);
      console.log(result.output);
      callback(null, {})
    }, err => {
      console.error(err);
      callback(null, {})
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
