/**
 * Drawers: an accordion where each handle toggles the drawer whose
 * `kjs-handle-id` matches its `kjs-id`, and closes every other drawer.
 *
 * @param {Element} widget element carrying kjs-type="drawers"
 */
function drawers(widget) {
  const handles = Array.from(widget.querySelectorAll('[kjs-role=handle]'));
  const panels = Array.from(widget.querySelectorAll('[kjs-role=drawer]'));

  function handleClick(event) {
    // currentTarget, not target: a handle may contain markup of its own.
    const openId = event.currentTarget.getAttribute('kjs-id');

    panels.forEach((panel) => {
      if (panel.getAttribute('kjs-handle-id') === openId) {
        panel.classList.toggle('open');
      } else {
        panel.classList.remove('open');
      }
    });
  }

  const actions = handles.map((handle) => ({
    element: handle,
    event: 'click',
    handler: handleClick,
  }));

  return { actions };
}

export default drawers;
