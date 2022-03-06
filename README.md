# Staking lpToken

Cмарт-контракт стейкинга, работает с пулом ликвидности uniswapV2. Контракт стейкинга принимает ЛП токены, после определенного времени пользователю начисляются награды в виде ревард токенов ERC20. 
Количество токенов зависит от суммы застейканных ЛП токенов (20 процентов). Вывести застейканные ЛП токены можно после определенного времени.
- Cсылка на контракт в сети rinkeby https://rinkeby.etherscan.io/address/0x61b08Db0d2559cFE85fae3bA5C9998Ed066A8e4b
- Ссылка на пул(MEGA/ETH) uniswapV2 https://rinkeby.etherscan.io/address/0x597974e59862fc896d1b66c5c478ad4161fb0fb4  
- Ссылка на контракт токенов (MEGA ERC20) https://rinkeby.etherscan.io/address/0xefdb0b230c136b567bd7b4a5448875b3a68f47aa
### В проекте сформированы следующие задачи:
- task("stake", "stake UniswapV2(UNI-V2) tokens")
- task("claim", "Claim reward MEGA(ERC20) tokens")
- task("unstake", "Unstake and get reward MEGA(ERC20) tokens")
```shell

npx hardhat stake  --contract 0x61b08Db0d2559cFE85fae3bA5C9998Ed066A8e4b --value 123  --network rinkeby  
npx hardhat claim  --contract 0x61b08Db0d2559cFE85fae3bA5C9998Ed066A8e4b  --network rinkeby
npx hardhat unstake  --contract 0x61b08Db0d2559cFE85fae3bA5C9998Ed066A8e4b  --network rinkeby
```
#### Пример отработки задач (транзакции)
-  task stake https://rinkeby.etherscan.io/tx/0x0f6e698a69baf1e89f6af6a974e8b09fe15ea8d5d55f6296c5bdcbcff373ad12#eventlog
-  task claim (13 мин после stake. )
reward=((123 * 13 * 60) / (10 * 60)) * 20%  = 31 
https://rinkeby.etherscan.io/tx/0xf3afbec47a2c56b435ca6a6cf4585b5bfe4f5c15e7dac7bda94b9b56b94855fd#eventlog
-  task unstake (25 мин после stake и 12 мин после claim) 
reward=(123 * 12 * 60) / (10 * 60)) * 20% = 30
https://rinkeby.etherscan.io/tx/0x24f9805e9ec506e5d0f2b9e428ca86f8118e1a28689b886a41678da437d80aa8#eventlog


### npx hardhat coverage

```shell
--------------|----------|----------|----------|----------|----------------|
File          |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
--------------|----------|----------|----------|----------|----------------|
 contracts\   |      100 |    96.55 |      100 |      100 |                |
  ERC20.sol   |      100 |    95.45 |      100 |      100 |                |
  LpERC20.sol |      100 |    95.45 |      100 |      100 |                |
  Staking.sol |      100 |      100 |      100 |      100 |                |
--------------|----------|----------|----------|----------|----------------|
All files     |      100 |    96.55 |      100 |      100 |                |
--------------|----------|----------|----------|----------|----------------|
```
### npx hardhat test

```shell
  Checking lpToken (ERC20)
    ✔ Checking functions - symbol(), decimals(), name(), totalSupply() (160ms)
    ✔ Checking function mint() event Transfer (184ms)
    ✔ Checking function balanceOf() (108ms)
    ✔ Checking function transfer(), event Transfer (177ms)
    ✔ Checking function event Approval, aprove(), allowance(), increaseAllowance(), decreaseAllowance() (162ms)
    ✔ Checking function transferFrom() (144ms)
    ✔ Checking function burn() (313ms)
    ✔ Checking contract creater is an owner
    ✔ Checking Should assign the total supply of tokens to the owner

  Checking myToken (ERC20)
    ✔ Checking functions - symbol(), decimals(), name(), totalSupply() (66ms)
    ✔ Checking function mint() event Transfer (89ms)
    ✔ Checking function balanceOf() (79ms)
    ✔ Checking function transfer(), event Transfer (126ms)
    ✔ Checking function event Approval, aprove(), allowance(), increaseAllowance(), decreaseAllowance() (133ms)
    ✔ Checking function transferFrom() (121ms)
    ✔ Checking function burn() (108ms)
    ✔ Checking contract creater is an owner
    ✔ Checking Should assign the total supply of tokens to the owner

  Staking
    ✔ Checking staking contract has reward pool
    ✔ Checking LpToken has tokens
    ✔ checking that change setting pool can only an owner (186ms)
    ✔ checking that can't stake `0`
    ✔ checking that can't unstake if you have't stake
    ✔ checking that can't clame if you have't stake
    ✔ checking balance after STAKE() (159ms)
    ✔ checking balance after STAKE()  restaking (152ms)
    ✔ checking balance after STAKE() and restake after 10 minutes (claim => check event Transfer) (164ms)
    ✔ checking UNstake() immediately after STAKE() (104ms)
    ✔ checking UNstake() after(20m) STAKE(). and also event 2xTransfer (167ms)
    ✔ checking claim() immediately after STAKE() (94ms)
    ✔ checking claim() immediately after STAKE() (88ms)
    ✔ checking claim() after(1h) STAKE() (141ms)
```
