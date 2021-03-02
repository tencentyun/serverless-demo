<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', getenv('DB_NAME') );

/** MySQL database username */
define( 'DB_USER', getenv('DB_USER') );

/** MySQL database password */
define( 'DB_PASSWORD', getenv('DB_PASSWORD') );

/** MySQL hostname */
define( 'DB_HOST', getenv('DB_HOST') );

/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'T_j`Y1eCtpKv+o6htqnWcYXFiy!aLNMkoKn yPSOSYd5+NgXtqCh<%J_*ada{{h+' );
define( 'SECURE_AUTH_KEY',  '|Y?V&~O?%_%7lA[L-~/$dIcI-!Hu1.0i_(7_V;?|k:0B`nO#[&<&:O? (o}jmcae' );
define( 'LOGGED_IN_KEY',    '9SA;>R!_L=^B.gOK9los2f _jnL@JG_=.<>eBt)Z7guZZ~7x!j}Q4|/4FRNS#U= ' );
define( 'NONCE_KEY',        't8[?#u|1t?;u5AA8nJ*w=jFF-n[~&=j)IbP3G0eYN%F]My]*[|UYinXwfaB ,(zX' );
define( 'AUTH_SALT',        'k`]J)HBvP,C)By?ECdZ`9B )rO)nUO@2>&bXcUb Z=851vwcRG8Q{[kJX,[Uu8(I' );
define( 'SECURE_AUTH_SALT', 'Byy10|/Q!o&_Mkh3ZzbVh2PCq$XN5i @uD^Zx1&6IRuDTRfLE{/S4o8V@7v$aK:&' );
define( 'LOGGED_IN_SALT',   'Jo0T_5ZP$13haI)?$,y#9I?VNEgi~Yg!!d$nv=e4|(RcwYkV4dV {,^p?-`cVRkk' );
define( 'NONCE_SALT',       '/t/s*>p[!ifV7v2-_qJt,*mg09m~AEpMiG,p=da2,EFoxRUP:g6~GV=UKceplm?X' );

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
