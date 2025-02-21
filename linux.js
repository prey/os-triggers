const command = ['/usr/bin/dbus-monitor', '--system'];

const EVENTS = {
  network: {
    opts: { interface: 'org.freedesktop.NetworkManager' },
    events: {
      'StateChanged'       : ['network', 'state_changed']
    },
  },
  power: {
    opts: {
      path: '/org/freedesktop/UPower/devices/line_power_ADP1',
      interface: 'org.freedesktop.DBus.Properties'
    },
    events: {
      'PropertiesChanged'  : ['battery', 'state_changed']
    }
  },
  system: {
    opts: {
      path: '/org/freedesktop/login1',
      interface: 'org.freedesktop.login1.Manager'
    },
    events: {
      'PrepareForSleep'    : ['system', 'state_changed']
    }
  },
  hostname: {
    opts: { interface: 'org.freedesktop.NetworkManager.Settings' },
    events: {
      'PropertiesChanged'  : ['hostname', 'state_changed']
    }
  },
  notifications: {
    opts: { interface: 'org.freedesktop.Notifications' },
    events: {
      'Notify'             : ['notification', 'opened'],
      'NotificationClosed' : ['notification', 'closed'],
      'ActionInvoked'      : ['notification', 'clicked']
    }
  },
  sound: {
    // opts: { path: '/com/canonical/indicator/sound/service' },
    opts: { interface: 'com.canonical.indicator.sound' },
    events: {
      'SoundStateUpdate'   : ['sound', 'state_updated']
    }
  },
  media: {
    opts: { interface: "org.freedesktop.Hal.Manage" },
    events: {
       'DeviceAdded'       : ['media', 'inserted'],
       'DeviceRemoved'     : ['media', 'removed']
    }
  },
  device: {
    opts: {
      path: '/org/freedesktop/Hal/devices/computer_logicaldev_input',
      interface: 'org.freedesktop.Hal.Device'
    },
    events: {
      'ButtonPressed'      : ['device', 'power_button_pressed']
    }
  }
}

var resolve_event = (data, type) => {
  if (type != 'all')
    return EVENTS[type].events[data.member];

  for (var type in EVENTS) {
    if (EVENTS[type].events[data.member]) {
      if (matches_opts(data, EVENTS[type].opts))
        return EVENTS[type].events[data.member];
    }
  }
};

var parse_sender = (line) => {
  var obj = {};

  line.split(/\s+/).forEach((arg) => {
    var split = arg.split('=');
    if (split[1])
      obj[split[0]] = split[1].replace(/;$/, '');
  });

  return obj;
};

var parse_args = (lines) => {
  return lines.filter((l) => {
    return !l.trim().match(/^\[|\]|\(|\)$/) && !l.match(/array|dict|variant/);
  }).map((l) => {
    return l.trim().split(',')[0].replace(/([^\s]+)/, '').trim()
  });
};

var matches_opts = (data, opts) => {
  var matches = true;

  for (var key in data) {
    if (opts[key] && opts[key] != data[key])
      matches = false;
  }
  return matches;
};

var matches_type = (data, type) => {
  if (type == 'all')
    return true;
  else
    return matches_opts(data, EVENTS[type].opts);
};


function Watcher(child, type, emitter) {

  var self = this;
  this.emitter = emitter || new Emitter();

  var parse_data = (data) => {

    data.toString().split('sender=').forEach((block) => {

      var lines = block.trim().split('\n'),
          data  = parse_sender(lines.shift());

      if (Object.keys(data).length > 0 && matches_type(data, type)) {

        var event = resolve_event(data, type),
            args = parse_args(lines);

        if (!event)
          return; // emitter.emit(data.member, args);

        self.emitter.emit(event[1], args);
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
