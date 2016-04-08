import React from 'react';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import UserList from './UserList.jsx';
import TeamList from './TeamList.jsx';
import PuzzleDashboard from './PuzzleDashboard.jsx';
import BulkEmail from './BulkEmail.jsx';
import GamePlay from './GamePlay.jsx';

Admin = React.createClass({

    getInitialState() {
        return {
            pageComp: UserList
        }
    },

    mixins: [ReactMeteorData],
    getMeteorData() {
        return {
            user: Meteor.user()
        };
    },

    componentDidMount() {
        $(this.refs.tabMenu).find('.item').tab();
    },

    setPage(targetPage) {
        this.setState({
            pageComp: targetPage
        });
    },

    render() {
        // First Check Access
        if (!this.data.user) {
            return <LoadingSegment />
        }
        else if (this.data.user.roles.indexOf('admin') < 0) {
            return <Login />
        }

        let pageComp = this.state.pageComp ? <this.state.pageComp /> : <div className="basic segment">Oops, no page found</div>;

        return (
            <div className="custom-bg red-square">
                <br/>
                <div className="ui raised segment transparent-bg">
                    <h3 className="ui violet center aligned header">Admin Panel</h3>
                    <div className="ui labeled icon menu">
                        <a className="item" onClick={this.setPage.bind(this, UserList)}>
                            <i className="green user icon"></i>
                            Users
                        </a>
                        <a className="item" onClick={this.setPage.bind(this, TeamList)}>
                            <i className="blue users icon"></i>
                            Teams
                        </a>
                        <a className="item" onClick={this.setPage.bind(this, PuzzleDashboard)}>
                            <i className="violet puzzle icon"></i>
                            Puzzles
                        </a>
                        <a className="item" onClick={this.setPage.bind(this, BulkEmail)}>
                            <i className="orange mail icon"></i>
                            Email
                        </a>
                        <a className="item" onClick={this.setPage.bind(this, GamePlay)}>
                            <i className="red gamepad icon"></i>
                            The Game
                        </a>
                    </div>
                    {pageComp}
                </div>
            </div>
        );
    }
});

/*
Admin.propTypes = {
    list: React.PropTypes.object,
    ...
}
        
*/
