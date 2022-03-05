# Staking lpToken

Cмарт-контракт стейкинга, работает с пулом ликвидности uniswapV2. Контракт стейкинга принимает ЛП токены, после определенного времени пользователю начисляются награды в виде ревард токенов ERC20. 
Количество токенов зависит от суммы застейканных ЛП токенов (20 процентов). Вывести застейканные ЛП токены можно после определенного времени.
- Cсылка на контракт в сети rinkeby https://rinkeby.etherscan.io/address/0x597974e59862f5d1b66c5c47561fb0ab1#code
- Ссылка на пул uniswapV2 https://rinkeby.etherscan.io/address/0x597974e59862fc896d1b66c5c478ad4161fb0fb4#code


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
