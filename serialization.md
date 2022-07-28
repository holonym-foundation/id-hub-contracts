# Serialization
**persona-field**, **bytes**

`name-first: 14`

`name-last: 14`

~~name-middle: 16 delete for more space~~

`initial-middle: 1` instead of name-middle to save space

`country-code: 3`

`address-street-1: 16`

`address-street-2: 12`

`address-city: 16`

`address-postal-code: 8`

`completed-at: 4` can be stored as uint32, thus 4 bytes

`birthday: 4` can be stored as uint32

# Thoughts on UUIDs
UUID could be hash(first, last, birthday). This is farily unique and fairly interoperable across different ID documents and providers. However, it is vulnerable to dictionary attacks, so should never be made public except with extreme caution.
