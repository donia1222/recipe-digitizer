#!/bin/bash
curl -X POST "https://web.lweb.ch/recipedigitalizer/apis/auth.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{"password":"Andrea1606"}'