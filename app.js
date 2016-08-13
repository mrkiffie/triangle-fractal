/* eslint-env browser */
(function () {


class Random {
  static int(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  static hsla() {
    const hue = this.int(0, 360);
    return 'hsla(' + hue + ', 80%, 50%, .8)';
  }
}

class NodeHelper {
  constructor(selector, width, height) {
    this.target = document.querySelector(selector);
    this.fragment = document.createDocumentFragment();
    this.target.width = `${width}%`;
    this.target.height = `${height}%`;
  }

  createNode(nodeType, options) {
    const node = document.createElement(nodeType);
    Object.keys(options).forEach(function(key) {
      node.setAttribute(key, options[key]);
    });
    return node;
  }

  plotPoint(x, y) {
    const node = document.createElement('div');
    node.className = 'circle';
    node.style.color = Random.hsla();
    node.style.left = `${x.toFixed(2)}%`;
    node.style.top = `${y.toFixed(2)}%`;
    this.fragment.appendChild(node);
  }

  attach() {
    this.target.appendChild(this.fragment);
  }

}

class TriangleFractal {
  constructor(selector) {
    const baseDimension = 100;
    this.width = baseDimension;
    this.height = Math.floor(baseDimension / 2 * Math.sqrt(3));

    this.nodeHelper = new NodeHelper(selector, this.width, this.height);
    this.cornerPoints = [{
      x: this.width / 2,
      y: 0
    }, {
      x: 0,
      y: this.height
    }, {
      x: this.width,
      y: this.height
    }];
    this.previousPoint = this.randomCornerPoint();
    this.nodeCount = 1000;
  }

  randomCornerPoint() {
    return this.cornerPoints[Random.int(0, this.cornerPoints.length - 1)];
  }

  calculateMidpoint() {
    const randomCorner = this.randomCornerPoint();
    const point = {
      x: (this.previousPoint.x + randomCorner.x) / 2,
      y: (this.previousPoint.y + randomCorner.y) / 2
    };
    this.previousPoint = point;
    return point;
  }

  plotTriangle() {
    for (let i = 0; i < this.nodeCount; i++) {
      let point = this.calculateMidpoint();
      this.nodeHelper.plotPoint(point.x, point.y);
    }
    this.nodeHelper.attach();
  }
}

const canvas = new TriangleFractal('#triangle');

canvas.plotTriangle();

const createStore = reducer => {
  let state;
  let listeners = [];

  const getState = () => state;

  const dispatch = action => {
    state = reducer(state, action);
    listeners.forEach(listener => listener());
  };

  const subscribe = listener => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  dispatch({});

  return {getState, dispatch, subscribe};
};

const combineReducers = reducers => {
  return (state = {}, action) => {
    return Object.keys(reducers).reduce(
      (nextState, key) => {
        nextState[key] = reducers[key](
          state[key],
          action
        );
        return nextState;
      },
      {}
    );
  };
};

const play = (state = false, action) => {
  switch (action.type) {
    case 'TOGGLE_PLAY':
      return !state;
    case 'PLAY':
      return true;
    case 'PAUSE':
      return false;
    default:
      return state;
  }
};

const speeds = [1000, 500, 250, 100, 50, 25, 10, 5];

const speed = (state = speeds[3], action) => {
  switch (action.type) {
    case 'UPDATE_SPEED':
      return speeds[action.index];
    default:
      return state;
  }
};

const controls = combineReducers({
  play,
  speed
});

const store = createStore(controls);

class Controls {
  constructor(store, selector = 'body') {
    this.store = store;
    this.nodes = document.querySelector(selector).querySelectorAll('.circle');
    this.node = this.nodes[0];
    this.pusleDuration = 1000;
    this.setTimeouts = [];

    this.controls = {
      replayButton: document.querySelector('#replay'),
      togglePlayButton: document.querySelector('#toggle'),
      speedInput: document.querySelector('#speed')
    };

    this.addEventListeners();
    this.addStoreListeners();
  }

  addStoreListeners() {
    this.store.subscribe(() => {
      const {play} = this.store.getState();
      if (play) {
        this.controls.togglePlayButton.classList.add('pause');
        this.controls.togglePlayButton.classList.remove('play');
      } else {
        this.controls.togglePlayButton.classList.add('play');
        this.controls.togglePlayButton.classList.remove('pause');
      }

      this.step(this.node);
    });
  }

  addEventListeners() {
    this.controls.replayButton.addEventListener('click', this.replay.bind(this));
    this.controls.togglePlayButton.addEventListener('click', this.togglePlay.bind(this));
    this.controls.speedInput.addEventListener('input', this.updateSpeed.bind(this));
  }

  togglePlay() {
    this.store.dispatch({
      type: 'TOGGLE_PLAY'
    });
  }

  updateSpeed(evt) {
    this.store.dispatch({
      type: 'UPDATE_SPEED',
      index: evt.target.value
    });
  }

  pulse(node) {
    requestAnimationFrame(() => {
      node.style.willChange = 'transform';
      node.style.transform = 'scale(1)';
      this.setTimeouts.push(
        setTimeout(function() {
          requestAnimationFrame(() => {
            node.style.willChange = '';
            node.style.transform = 'scale(.3)';
          });
        }, this.pusleDuration)
      );
    });
  }

  hideAll() {
    const nodes = Array.from(this.nodes);
    requestAnimationFrame(() => {
      nodes.forEach(node => {
        node.style.willChange = 'transform';
        node.style.transition = 'none';
        node.style.transform = 'scale(0)';
      });

      setTimeout(() => {
        requestAnimationFrame(() => {
          nodes.forEach(node => {
            node.style.willChange = '';
            node.style.transition = '';
          });
        });
      }, 0);
    });
  }

  step(node) {
    if (node) {
      const {play, speed} = this.store.getState();
      if (play) {
        this.pulse(node);
        this.node = node.nextSibling;
        this.setTimeouts.push(setTimeout(() => {
          this.step(node.nextSibling);
        }, speed));
      }
    }
  }

  replay() {
    this.hideAll();
    this.clearTimeouts();
    this.node = this.nodes[0];
    this.store.dispatch({
      type: 'PLAY'
    });
  }

  clearTimeouts() {
    if (this.setTimeouts) {
      this.setTimeouts = this.setTimeouts.filter(id => clearTimeout(id));
    }
  }
}

window.control = new Controls(store);
})();
