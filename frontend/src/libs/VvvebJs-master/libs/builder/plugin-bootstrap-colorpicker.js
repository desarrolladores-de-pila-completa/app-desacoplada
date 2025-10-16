let ColorInput = Object.assign({}, typeof ColorInput !== 'undefined' ? ColorInput : {}, {
  events: [
    ["change", "onChange", "input"],
  ],

  setValue: function(value) {
    // If rgb2hex exists, use it to convert; otherwise assume value is already a hex string
    let color = (typeof this.rgb2hex === 'function') ? this.rgb2hex(value) : value;
    // Set the input value to the color and update the preview icon background
    $('input', this.element).val(color);
    $('i', this.element).css('background-color', color);
  },

  init: function(data) {
    let colorinput = this.render("bootstrap-color-picker-input", data);
    // initialize bootstrap colorpicker on the input-group inside the rendered element
    $('.input-group', colorinput).colorpicker();
    return colorinput;
  }
});