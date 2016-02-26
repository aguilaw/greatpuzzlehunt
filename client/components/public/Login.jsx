// Define our login comp

Login = React.createClass({

    getInitialState() {
      return {
        err: null,
        username: '',
        password: ''
      };
    },

    login(event) {
        event.preventDefault();

        let username = $(this.refs.username).val();
        let password = $(this.refs.password).val();

        Meteor.loginWithPassword(username, password, (err) => {
            
            if (err) {
              this.setState({err: err});
            }
        });
    },

    getErrorMessage() {
      if (this.state.err != null) {
        return <div className="ui error message">{this.state.err.reason}</div>;
      }
      else {
        return null;
      }
    },

    render() {
      return (
      <div className="login ui middle aligned center aligned grid">
          <div className="column">
              <form className="ui large form" onSubmit={this.login}>
                <div className="ui raised segment">
                  <h2 className="ui blue header">
                    <div className="content">
                      Altitude
                    </div>
                  </h2>
                  <div className="field">
                    <div className="ui left icon input">
                      <i className="user icon"></i>
                      <input type="text" ref="username" placeholder="Username" autoComplete="off" defaultValue={this.state.username}/>
                    </div>
                  </div>
                  <div className="field">
                    <div className="ui left icon input">
                      <i className="lock icon"></i>
                      <input type="password" ref="password" placeholder="Password" autoComplete="off" defaultValue={this.state.password}/>
                    </div>
                  </div>
                  <input className="ui fluid large blue submit button" type="submit" value="Login" />
                </div>
              </form>
              {this.getErrorMessage()}

              <div className="ui message">
                <a href="/register">Join Altitude!</a>
              </div>
          </div>
      </div>);
    }
});
