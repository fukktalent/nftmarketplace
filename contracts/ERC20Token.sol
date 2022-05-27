//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract ERC20Token {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed from,
        address indexed spender,
        uint256 value
    );

    constructor(string memory _name, string memory _symbol) {
        require(
            bytes(_name).length != 0 && bytes(_symbol).length != 0,
            "args shouldn't be empty"
        );
        owner = msg.sender;
        name = _name;
        symbol = _symbol;
        decimals = 18;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier noZeroAddr(address account) {
        require(account != address(0), "address shouldn't be zero");
        _;
    }

    modifier enoughBalance(address account, uint256 value) {
        require(_balances[account] >= value, "not enough balance");
        _;
    }

    function balanceOf(address account) public view returns (uint256 balance) {
        return _balances[account];
    }

    function transfer(address to, uint256 value) public returns (bool success) {
        _transfer(msg.sender, to, value);

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public returns (bool success) {
        require(allowance(from, msg.sender) >= value, "not allowed amount");

        _transfer(from, to, value);

        _allowances[from][msg.sender] -= value;
        emit Approval(from, msg.sender, _allowances[from][msg.sender]);

        return true;
    }

    function approve(address spender, uint256 value)
        public
        noZeroAddr(spender)
        returns (bool success)
    {
        _allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);

        return true;
    }

    function allowance(address holder, address spender)
        public
        view
        returns (uint256 remaining)
    {
        return _allowances[holder][spender];
    }

    function mint(address account, uint256 value)
        public
        onlyOwner
        noZeroAddr(account)
    {
        totalSupply += value;
        _balances[account] += value;
        emit Transfer(address(0), account, value);
    }

    function burn(address account, uint256 value)
        public
        onlyOwner
        enoughBalance(account, value)
    {
        _balances[account] -= value;
        totalSupply -= value;
        emit Transfer(account, address(0), value);
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal enoughBalance(from, value) noZeroAddr(to) {
        _balances[from] -= value;
        _balances[to] += value;
        emit Transfer(from, to, value);
    }
}
