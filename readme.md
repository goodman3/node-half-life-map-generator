# node-half-life-map-generator

## Introduction

This tool converts png file into half-life 1 *.map .

## png format

Each pixel's RGB value represents height.

* If R>G>B:
    Brush will look like this:
    ```
        ┌-------┐   -> R value
        |       |
        |       |
        └--------   -> G value
        
        ┌-------┐   -> B value
        |       |
        └-------┘
    ```
 
 * Other combination are reserved.