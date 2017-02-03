-- manual testing

primes :: [Integer]
primes = filterPrime [2..]
  where filterPrime (p:xs) =
          p : filterPrime [x | x <- xs, x `mod` p /= 0]

main :: IO ()
main = print$ show $ take 10 primes

-- automated tests

test1 = print$ "hello"

test2_helper = "hello"
test2 = print$ test2_helper

test3_value = 3

test4 = undefined
