import { Component, createRef, type ReactNode } from "react";

type Props = { screenKey: string; children: ReactNode };
type State = { key: string; entering: boolean };

export class ScreenTransition extends Component<Props, State> {
  private container = createRef<HTMLDivElement>();
  private screen = createRef<HTMLDivElement>();
  private outgoing: HTMLElement | null = null;
  private removal = 0;
  private enterClear = 0;
  state: State = { key: this.props.screenKey, entering: false };

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.screenKey === state.key) return null;
    return { key: props.screenKey, entering: true };
  }

  getSnapshotBeforeUpdate(previous: Props): HTMLElement | null {
    if (previous.screenKey === this.props.screenKey || !this.screen.current) return null;
    return this.screen.current.cloneNode(true) as HTMLElement;
  }

  componentDidUpdate(_previous: Props, _state: unknown, snapshot: HTMLElement | null) {
    if (!snapshot || !this.container.current) return;
    this.outgoing?.remove();
    window.clearTimeout(this.removal);
    window.clearTimeout(this.enterClear);
    snapshot.className = "screen is-leaving";
    snapshot.setAttribute("aria-hidden", "true");
    snapshot.inert = true;
    this.container.current.prepend(snapshot);
    this.outgoing = snapshot;
    const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--motion-screen-crossfade")) || 0;
    this.removal = window.setTimeout(() => {
      snapshot.remove();
      if (this.outgoing === snapshot) this.outgoing = null;
    }, duration);
    this.enterClear = window.setTimeout(() => this.setState({ entering: false }), duration);
  }

  componentWillUnmount() {
    window.clearTimeout(this.removal);
    window.clearTimeout(this.enterClear);
  }

  render() {
    return (
      <div ref={this.container} className="screen-transition">
        <div ref={this.screen} key={this.props.screenKey} className={`screen${this.state.entering ? " is-entering" : ""}`}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
