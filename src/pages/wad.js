import React, { Component } from "react";

class Wad extends Component {
  componentDidMount() {
    window.location.replace(
      `https://drive.google.com/file/d/1yQCxUeyUlzwOYN1QFOmqzWN7kCe8EQ2y/view?usp=sharing`
    );
  }
  render() {
    return <span>Redirecting...</span>;
  }
}

export default Wad;
