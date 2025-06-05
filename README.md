# Time-is-Money

🔥🦊 Firefox extension that converts displayed prices to equivalent hours of your life, factoring in salary, work hours, vacation, commute time and commute cost.

## Overview

This Firefox extension is designed to make users aware of the real-time cost of items in terms of hours of their life they need to spend to afford it.
With the extension active, all price figures on web pages are automatically converted to an equivalent in 'hours spent on work', based on the user's income-related information.

## Features

- **Automatic Price Conversion**: Converts visible prices on web pages to 'hours spent on work'.
- **Supports Multiple Currencies**: Automatically detects and handles different currencies.
- **User Settings**: Customize the conversion based on individual income, workdays, and other settings.
- **Toggle On/Off**: Easily enable or disable the extension from the settings menu.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/mkapulica/Time-is-Money.git
    ```

2. Load the extension into Firefox:

    - Open Firefox and go to `about:debugging`.
    - Click on "This Firefox".
    - Click "Load Temporary Add-on" and select any file in the cloned repository.

## Usage

- After installation, you can configure the extension by clicking its icon.
- Enter the required fields, such as 'Monthly Income', 'Weekly Workdays', and so on.
- Check the 'Enable Extension' checkbox.
- Click 'Save' to start seeing price figures converted to hours worked.

## Configuration Options

- **Monthly Income**: Your average monthly income.
- **Weekly Workdays**: Number of days you work in a week.
- **Daily Work Hours**: Number of hours you work per day.
- **Daily Commute (in minutes)**: Total commuting time in minutes per day.
- **Monthly Commute Cost**: Total cost of commuting to and from work per month.
- **Vacation Days**: Number of vacation days per year.

## Benchmark

Run `node benchmark.js` to compare the previous recursive approach with the
current tree-walking logic. On the reference setup, processing 1000 text nodes
produced output similar to:

```
Recursive: 6ms
Tree walker: 3ms
```

The tree walker performs roughly twice as fast as the old implementation.
