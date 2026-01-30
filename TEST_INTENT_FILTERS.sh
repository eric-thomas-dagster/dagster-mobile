#!/bin/bash
# Test script to check if intent filters are working

echo "Testing intent filters..."
echo ""
echo "Test 1: HTTPS link with subdomain"
adb shell am start -a android.intent.action.VIEW -d "https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__/sensors/test"
echo ""
echo "Waiting 3 seconds..."
sleep 3

echo ""
echo "Test 2: HTTPS link with direct domain"
adb shell am start -a android.intent.action.VIEW -d "https://dagster.cloud/hooli/data-eng-prod/workspace/__repository__/sensors/test"
echo ""
echo "Waiting 3 seconds..."
sleep 3

echo ""
echo "Test 3: Custom URL scheme (should always work)"
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__/sensors/test"
echo ""
echo ""
echo "If you see 'Open with' dialogs, intent filters are working!"
echo "If links open directly in Chrome, Chrome is set as default."

