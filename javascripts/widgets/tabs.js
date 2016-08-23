/**
 * Tabs: one tab is active at a time and reveals the content pane whose
 * `kjs-tab-id` matches its `kjs-id`.
 *
 * @param {Element} widget element carrying kjs-type="tabs"
 */
function tabs(widget) {
  const contents = Array.from(widget.querySelectorAll('[kjs-role=content]'));
  const tabElements = Array.from(widget.querySelectorAll('[kjs-role=tab]'));

  if (tabElements.length === 0) {
    return { actions: [] };
  }

  function setup() {
    // Markup is not guaranteed to mark a tab active; fall back to the first.
    const activeTab = widget.querySelector('.active[kjs-role=tab]') ?? tabElements[0];
    activeTab.classList.add('active');

    contents.forEach((content) => {
      const isActive = activeTab.getAttribute('kjs-id') === content.getAttribute('kjs-tab-id');
      content.classList.toggle('active', isActive);
    });
  }

  function handleTabClick(event) {
    // currentTarget, not target: a tab may contain markup of its own.
    tabElements.forEach((tab) => tab.classList.remove('active'));
    event.currentTarget.classList.add('active');
    setup();
  }

  const actions = tabElements.map((tab) => ({
    element: tab,
    event: 'click',
    handler: handleTabClick,
  }));

  return { setup, actions };
}

export default tabs;
