// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Staking is AccessControl {
    ERC20 internal lpToken; // contract Uniswap V2 (UNI-V2) 0x597974e59862fc896d1b66c5c478ad4161fb0fb4;
    ERC20 internal myToken; // = contract MEGA token (ERC20) 0xefdb0b230c136b567bd7b4a5448875b3a68f47aa;

    uint256 public rewardProc = 20; // Процент наград за стейкинг
    uint256 public rewardStakingTime = 10 * 1 minutes; // время спустя которое начисляются реварды
    uint256 public withdrawStakingTime = 20 * 1 minutes; // время спустя которое доступен вывод ревардов

    // создаем наименование роли админа
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct UserStake {
        uint256 stakingDate;
        uint256 claimDate;
        uint256 amount;
    }
    mapping(address => UserStake) internal stakingPool;

    modifier onlyStaker() {
        // Проверяем есть ли застейканые токены?
        require(
            stakingPool[msg.sender].amount > 0,
            "you dont have stake lpTokens"
        );
        _;
    }

    constructor(ERC20 _lpToken, ERC20 _myToken) {
        lpToken = _lpToken; // contract Uniswap V2 (UNI-V2)
        myToken = _myToken; // contract MEGA token (ERC20)

        // даем роль админа овнеру
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Функция возвращает время(сек), которое прошло с момента стейкинга
    function getMyStakeValue() public view returns (uint256 amount) {
        amount = stakingPool[msg.sender].amount;
    }

    // Функция возвращает время(сек), которое прошло с момента стейкинга
    function _durationStake() internal view returns (uint256) {
        return block.timestamp - stakingPool[msg.sender].stakingDate;
    }

    // Функция возвращает время(сек), которое прошло с момента последнего клейма
    function _durationClaim() internal view returns (uint256) {
        return block.timestamp - stakingPool[msg.sender].claimDate;
    }
    // Функция стейкинга
    function stake(uint256 _amount) public {
        require(_amount > 0, "it is not enought for stake");

        // Переводим токены пула к нам на контракт
        lpToken.transferFrom(msg.sender, address(this), _amount);

        if (stakingPool[msg.sender].amount == 0) {
            // Первый стейкинг
            // Записываем инфу о старте стейкинга
            stakingPool[msg.sender].stakingDate = block.timestamp;
            stakingPool[msg.sender].claimDate = block.timestamp;
        } else {
            if (_durationClaim() >= rewardStakingTime) {
                // Если пользователь стейкает повторно и уже можно начислить реварды
                _claim();
            } else {
                // Записываем инфу о старте стейкинга
                stakingPool[msg.sender].stakingDate = block.timestamp;
                stakingPool[msg.sender].claimDate = block.timestamp;
            }
        }

        // Учитываем количестве застейканых токенов
        stakingPool[msg.sender].amount += _amount;
    }

    function unstake() public onlyStaker {
        // пррошел период запета на выход из стейкинга ?
        require(
            _durationStake() >= withdrawStakingTime,
            "You should wait more time"
        );
        // возвращаем lpToken
        lpToken.transfer(
            msg.sender,
            stakingPool[msg.sender].amount
        );
        // Возвращаем реварды
        _claim();
        // обнуляем баланс стейкинга
        stakingPool[msg.sender] = UserStake({
            stakingDate: 0,
            claimDate: 0,
            amount: 0
        });
    }

    function claim() public onlyStaker {
        // пррошел период запета для получени ревардов ?
        require(
            _durationStake() >= rewardStakingTime,
            "You should wait more time"
        );

        _claim();
    }

    function _claim() internal {
        uint256 reward;
        // Вычисляем количество ревардов
        reward =
            (stakingPool[msg.sender].amount * rewardProc * _durationClaim()) /
            (100 * rewardStakingTime);
        // Обновляем дату последнего клейма
        stakingPool[msg.sender].claimDate = block.timestamp;
        // переводим награду
        myToken.transfer(msg.sender, reward);
    }

    function changeSetting(
        uint256 _rewardProc,
        uint256 _rewardStakingTime,
        uint256 _withdrawStakingTime
    ) public onlyRole(ADMIN_ROLE) {
        require(_rewardProc <= 100, "reward must be from 0 to 100 percent");
        rewardProc = _rewardProc; // Процент наград за стейкинг
        rewardStakingTime = _rewardStakingTime; // время спустя которое начисляются реварды
        withdrawStakingTime = _withdrawStakingTime; // время спустя которое доступен вывод ревардов
    }
}