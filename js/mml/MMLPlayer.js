const isSP = typeof window.ontouchstart !== 'undefined';
function MMLPlayer(part) {
  this.notes = part.notes;
  this.playPos = 0;
  this.playTime = 0;
  this.startTime = 0;
  this.duration = part.pos;
  this.playId = 0;
  this.sounds = {};
  this.onended = null;
  
  this.view = null;
  this.showPos = 0;
  this.showTime = 0;
  this.showId = 0;
  this.showingNotes = [];
  this.analyser
}

MMLPlayer.prototype.play = function () {
  if (this.playId) return ;
  this.showTime = this.playTime;
  this.startTime = actx.currentTime - this.playTime;
  var i = 0;
  while (i < this.notes.length && this.notes[i].endTime <= this.playTime) {
    i++;
  }
  this.playPos = i;
  this.showPos = i;
  this.playSmallSegment(this.playTime + 4, true);
  this.playTimeout();
  this.showPlaying(this.showTime, true);
  this.showTimeout();
};

MMLPlayer.prototype.stopSound = function () {
  clearTimeout(this.playId);
  this.playId = 0;
  for (var i in this.sounds) {
    var e = this.sounds[i];
    try {
      e.src.stop();
    }
    catch (x) {
      e.src.disconnect();
      e.src.connect(stoppedSound);
    }
  }
  this.sounds = {};
};

MMLPlayer.prototype.stop = function () {
  if (this.playId) {
    this.stopSound();
    this.playTime = 0;
    if (this.onended) this.onended();
  }
  else {
    this.playTime = 0;
  }
  this.stopAnimation();
};

MMLPlayer.prototype.pause = function () {
  if (this.playId) {
    this.stopSound();
    this.playTime = actx.currentTime - this.startTime;
    this.showTime = this.playTime;
  }
  cancelAnimationFrame(this.showId);
  this.showId = 0;
};

MMLPlayer.prototype.playTimeout = function () {
  var me = this;
  if (me.playPos < me.notes.length) {
    me.playId = setTimeout(function () {
      me.playSmallSegment(actx.currentTime - me.startTime + 4, false);
      me.playTimeout();
    }, 2000);
  }
  else {
    me.playId = setTimeout(function () {
      me.playId = 0;
      me.playTime = 0;
      if (me.onended) me.onended();
    }, (me.startTime + me.duration - actx.currentTime) * 1000);
  }
};

MMLPlayer.prototype.playSmallSegment = function (to, first) {
  var notes = this.notes;
  for (var i = this.playPos; i < notes.length; i++) {
    var n = notes[i];
    if (n.startTime > to) break;
    if (i > this.playPos && !n.chord) first = false;
    if (!first && n.tieBefore) continue;
    if (n.type === "rest") {
    } else if (n.type === "note") {
      piano.setVolume(n.volume)
      // this.playSound(n, i);
    }
  }
  this.playPos = i;
  this.playTime = to;
};

MMLPlayer.prototype.playSound = function (note, id) {
  var src = actx.createBufferSource();
  var env = actx.createGain();
  src.buffer = fakePno.sample;
  src.loop = true;
  src.loopStart = fakePno.loopStart;
  src.loopEnd = fakePno.loopEnd;
  src.playbackRate.value = Math.pow(2, (note.pitch - fakePno.center) / 12);
  src.connect(env);
  
  env.connect(master);
    
  var startTime = this.startTime + note.startTime;
  var nn = note;
  while (nn.tieAfter) {
    nn = nn.tieAfter;
  }
  var endTime = this.startTime + nn.endTime;
  
  var vol = note.volume;
  env.gain.value = vol;
  env.gain.linearRampToValueAtTime(vol, Math.max(endTime - 0.05, (startTime + endTime) / 2));
  env.gain.linearRampToValueAtTime(0, endTime);
  
  if(src.start)
    src.start(startTime);
  else
    src.noteOn(startTime);
  var sounds = this.sounds;
  src.onended = function () {
    delete sounds[id];
  };
  
  if (src.stop)
    src.stop(endTime);
  else
    src.noteOff(endTime);
  this.sounds[id] = {src: src, env: env};
};

MMLPlayer.prototype.stopAnimation = function () {
  cancelAnimationFrame(this.showId);
  this.showId = 0;
  for (var i = 0; i < this.showingNotes.length; i++) {
    this.hideNote(this.showingNotes[i]);
  }
  this.showingNotes.length = 0;
};

MMLPlayer.prototype.showTimeout = function () {
  var me = this;
  if (me.showPos < me.notes.length || me.showingNotes.length > 0) {
    me.showId = requestAnimationFrame(function () {
      me.showPlaying(actx.currentTime - me.startTime, false);
      me.showTimeout();
    });
  }
};

MMLPlayer.prototype.showPlaying = function (to, first) {
  //移動時間軸
  move_duration(to)
  
  const piano_keyboard = document.querySelectorAll('.piano_keyboard .keyboard')
  var notes = this.showingNotes;
  for (var i = 0; i < notes.length; i++) {
    if (notes[i].endTime <= to) {
      var n = notes[i];
      const pitch = (Math.floor(n.pitch / 12) - (Math.floor(n.pitch / 12)?1:-1) ) * 12 + 4 + (n.pitch % 12) - 1 - 12
      if (n.pitch > 0 && piano_keyboard[pitch]) {
        piano_keyboard[pitch].classList.remove('active')
      }
      this.hideNote(notes[i]);
      notes[i] = null;
    }
  }
  var j = 0;
  for (var i = 0; i < notes.length; i++) {
    if (notes[i] !== null) {
      notes[j] = notes[i];
      j++;
    }
  }
  notes.length = j;
  var notes = this.notes;
  for (var i = this.showPos; i < notes.length; i++) {
    var n = notes[i];
    if (n.startTime > to) break;
    if (i > this.showPos && !n.chord) first = false;
    if (!first && n.tieBefore) continue;
    //if (n.type === "rest") continue;
    // console.log(n,i)
    const pitch = (Math.floor(n.pitch / 12) - (Math.floor(n.pitch / 12)?1:-1) ) * 12 + 4 + (n.pitch % 12) - 1 - 12
    // console.log(n.pitch,pitch)
    if (n.pitch > 0 && piano_keyboard[pitch]) {
      piano_keyboard[pitch].classList.add('active')
      if (isSP) {
        piano_keyboard[pitch].dispatchEvent(new TouchEvent("touchstart"))
      } else {
        piano_keyboard[pitch].click()
      }
    }
    this.showNote(n, i);
  }
  this.showPos = i;
  this.showTime = to;
};

MMLPlayer.prototype.showNote = function (n, i) {
  while (n.tieAfter) {
    this.view.notes[n.source].span.classList.add('playing');
    n = n.tieAfter;
  }
  this.showingNotes.push(n);
  this.view.notes[n.source].span.classList.add('playing');
};

MMLPlayer.prototype.hideNote = function (n) {
  while (n.tieBefore) {
    this.view.notes[n.source].span.classList.remove('playing');
    n = n.tieBefore;
  }
  this.view.notes[n.source].span.classList.remove('playing');
};

MMLPlayer.prototype.seek = function (nsec) {
  var playing = this.playId;
  // stop current playing notes
  this.pause();
  this.stopAnimation();

  // jump to new location
  this.playTime = nsec;
  this.showTime = this.playTime;

  this.playPos = 0;
  this.showPos = 0;
  if (playing) {
    // continue playing
    this.play();
  }
};

MMLPlayer.prototype.getCurrentPos = function () {
  if (this.playId) {
    return actx.currentTime - this.startTime;
  }
  else {
    return this.playTime;
  }
};
