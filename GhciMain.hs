module GhciMain(peekValue) where

import System.IO.Unsafe
import Data.IORef
import Control.Concurrent

peekValue :: a -> a
peekValue value = unsafePerformIO$ do
    ref <- newIORef value
    result <- newEmptyMVar
    _ <- forkIO (do
        val <- readIORef ref
        result `putMVar` val
        )
    readMVar result
