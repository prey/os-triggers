const command = [require('path').join(__dirname, 'bin', 'lightevt.exe'), '--monitor'];

const EVENTS = {
  network: {
    events: {
      'address-changed'       : ['network', 'state_changed']
    },
  },
  power: {
    events: {
      'low-battery'           : ['power', 'low_power'],
      'power-status-changed'  : ['power', 'state_changed']
    }
  },
  session: {
    events: {
      'session-logged-on'     : ['session', 'started'],
      'session-locked'        : ['session', 'locked'],
      'session-unlocked'      : ['session', 'unlocked'],
      'session-logged-off'    : ['session', 'finished']
    }
  },
  system: {
    events: {
      'about-to-suspend'            : ['system', 'suspended'],
      'resumed-from-suspend'        : ['system', 'unsuspended'],
      'auto-resumed-from-low-power' : ['system', 'resumed'],
      'os-about-to-shutdown'        : ['system', 'shutdown']
    }
  },
  hostname: {
    events: {
      'nothing' : ['hostname', 'state_changed']
    }
  }
}

var resolve_event = (name, type) => {
  if (type != 'all')
    return EVENTS[type].events[name];

  for (var type in EVENTS) {
    if (EVENTS[type].events[name])
      return EVENTS[type].events[name];
  }
};

var matches_type = (key, type) => {
  if (type == 'all')
    return true;
  else
    return !!EVENTS[type].events[key];
};


function Watcher(child, type, emitter) {

  var self = this;
  this.emitter = emitter || new Emitter();

  var parse_data = (data) => {
    data.toString().trim().split('\n').forEach((line) => {

      var split = line.split(':'),
          name  = split[0],
          data  = split[1];

      if (matches_type(name, type)) {
        var event = resolve_event(name, type);

        if (!event)
          return; // emitter.emit(data.member, args);

        self.emitter.emit(event[1]);
      }

    })
  }

  child.stdout.on('data', parse_data);

  this.stop = () => {
    child.stdout.removeListener('data', parse_data);
  }

}

exports.command = command;
exports.Watcher = Watcher;
exports.EVENTS  = EVENTS;
