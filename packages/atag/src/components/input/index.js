import debounce from '../../shared/debounce';
import { PolymerElement, html } from '@polymer/polymer';

let uid = 0;

export default class Input extends PolymerElement {
  static get is() {
    return 'a-input';
  }

  static get properties() {
    return {
      value: {
        type: String,
        value: '',
        observer: '_observeValue',
      },
      type: {
        type: String,
        value: 'text',
      },
      placeholder: {
        type: String,
        value: '',
        reflectToAttribute: true,
      },
      placeholderStyle: {
        type: String,
        value: 'color: #999;',
        observer: '_changePlaceholderStyle',
      },
      disabled: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
      },
      maxlength: {
        type: Number,
        value: 140,
      },
      focus: {
        type: Boolean,
        value: false,
        observer: '_observeFocus',
      },
    };
  }

  constructor() {
    super();
    /**
     * In case of calling focus or blur more than once in a moment.
     */
    this._observeFocus = debounce(this._observeFocus);
  }

  ready() {
    super.ready();
    this._initalValue = this.value;
    this.setAttribute('a-label-target', '');
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('input', this._handleInput, true);
    window.addEventListener('focus', this._handleFocus, true);
    window.addEventListener('blur', this._handleBlur, true);
    window.addEventListener('_formReset', this._handleReset, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('input', this._handleInput, true);
    window.removeEventListener('focus', this._handleFocus, true);
    window.removeEventListener('blur', this._handleBlur, true);
    window.removeEventListener('_formReset', this._handleReset, true);
  }

  _observeFocus() {
    const method = this.focus ? 'focus' : 'blur';
    this.$.input[method]();
  }

  /**
   * Sync a-input value to real input value.
   * @private
   */
  _observeValue() {
    this.$.input.value = this.value;
  }

  /**
   * Sync input value to a-input, and dispatch custom input event at mean time.
   * @param evt {InputEvent} event.
   * @private
   */
  _handleInput = (evt) => {
    if (!(evt instanceof CustomEvent)) {
      evt.stopPropagation();

      // If inputType is insertCompositionText, user doesnt's really
      // input something in value, do not sync value.
      // ref: https://w3c.github.io/input-events/#dom-inputevent-inputtype
      if (evt.inputType === 'insertCompositionText') return;

      if (evt.target === this) {
        const value = this.value = this.$.input.value;
        const customEvent = new CustomEvent('input', {
          bubbles: false,
          cancelable: true,
          detail: {
            value,
            cursor: this._getSelectionStart(),
          },
        });
        this.dispatchEvent(customEvent);
      }
    }
  };

  /**
   * In some case, you will not be allowed to access selectionStart value in DOM.
   * For instance, input with type of password and number.
   * @return {number} Selection start.
   * @private
   */
  _getSelectionStart() {
    try {
      return this.$.input.selectionStart;
    } catch (err) {
      return 0;
    }
  }

  _handleFocus = (evt) => {
    if (!(evt instanceof CustomEvent)) {
      evt.stopPropagation();
      if (evt.target === this) {
        const customEvent = new CustomEvent('focus', {
          bubbles: false,
          cancelable: true,
          detail: {
            value: this.$.input.value,
          },
        });
        this.dispatchEvent(customEvent);
      }
    }
  };

  _handleBlur = (evt) => {
    if (!(evt instanceof CustomEvent)) {
      evt.stopPropagation();
      if (evt.target === this) {
        const customEvent = new CustomEvent('blur', {
          bubbles: false,
          cancelable: true,
          detail: {
            value: this.$.input.value,
          },
        });
        this.dispatchEvent(customEvent);
      }
    }
  };

  _changePlaceholderStyle(placeholderStyle) {
    /**
     * HACK: unique id for data-id to avoid style pollution
     */
    if (!this._placeholderStyleElement) {
      this._id = `input-${++uid}`;
      this._placeholderStyleElement = document.createElement('style');
      this.setAttribute('data-id', this._id);
      const shadowRoot =
        this.shadowRoot || this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(this._placeholderStyleElement);
    }

    this._placeholderStyleElement.textContent = `
      :host #input::placeholder {
        ${placeholderStyle}
      }
      a-input[data-id=${this._id}] #input::-webkit-input-placeholder {
        ${placeholderStyle}
      }
    `;
  }

  _handleReset = (evt) => {
    let parentElement = this.parentElement;

    while (parentElement) {
      if (parentElement === evt.target) {
        this.$.input.value = this.value = this._initalValue;
        break;
      }
      parentElement = parentElement.parentElement;
    }
  };

  static get template() {
    return html`
      <style>
        :host {
          display: inline-block;
          background-color: #fff;
        }
  
        :host #input {
          all: unset;
          width: 100%;
          height: 100%;
          /*
           * HACK: webkit placeholder color will 
           * inherit from color, reset here
           */
          -webkit-text-fill-color: initial;
          
          /**
           * User can select to type text
           */
          -webkit-user-select: auto;
          user-select: auto;
        }
  
      </style>
      <input 
        id="input" 
        placeholder="[[placeholder]]" 
        type$="[[type]]" 
        disabled$="[[disabled]]"
        autofocus$="[[focus]]" 
        maxlength$="[[maxlength]]" 
      />
    `;
  }
}

customElements.define(Input.is, Input);
