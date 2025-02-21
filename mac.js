const command = ['scutil'];

const EVENTS = {
  network: {
    key: 'State:/Network/Global/IPv4',
    event: 'state_changed'
  },
  power: {
    key: 'State:/IOKit/PowerManagement/SystemLoad',
    event: 'state_changed'
  },
  hostname: {
    key: 'Setup:/Network/HostNames',
    event: 'state_changed'
  },
  system: {
    key: 'State:/IOKit/SystemPowerCapabilities',
    event: 'state_changed'
  }
}

var figure_type = (key) => {
  for (var type in EVENTS) {
    if (EVENTS[type].key == key)
      return type;
  }
}

function Watcher(child, type, emitter) {
  var type_keys = [EVENTS[type].key];

  var parse_data = (data) => {
    var str = data.toString().trim();

    if (str.match(/changed\s?key/i)) {
      var split = str.split(/\s+/),
          key   = split[split.length-1];

      if (type_keys.indexOf(key) == -1) return;

      var type        = figure_type(key),
          event_name  = EVENTS[type].event;

      emitter.emit(event_name);
    }
  }

  child.stdout.on('data', parse_data);

  this.stop = () => {
    child.stdout.removeListener('data', parse_data);
  }

  child.stdin.write('n.cancel' + '\n');
  type_keys.forEach((key) => {
    child.stdin.write('n.add ' + key + '\n');
  })
  child.stdin.write('n.watch' + '\n');
}

exports.Watcher = Watcher;
exports.command = command;
exports.EVENTS  = EVENTS;